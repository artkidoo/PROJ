/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * KEEDOHUB — Admin HQ Shared Operations Console
 */

import React from 'react';
import {
  Clapperboard,
  FileCheck2,
  Inbox,
  Package,
} from 'lucide-react';
import type { SharedOpsTab } from '../../lib/adminHQNavigation';
import {
  AdminProduction,
  type AdminProductionNavigateOptions,
  type AdminProductionSection,
} from './AdminProduction';
import { ServicesPackagesManagement } from './ServicesPackagesManagement';

interface AdminSharedOperationsProps {
  subTab: SharedOpsTab;
  onSubTabChange: (subTab: SharedOpsTab) => void;
  selectedProjectId: string;
  selectedProjectTab: 'overview' | 'tasks' | 'deliverables' | 'notes' | 'revisions' | 'activity';
  projectClientFilter: string;
  projectWorkspaceFilter: string;
  projectStageFilter: string;
  projectOverdueOnly: boolean;
  onClearProjectFilters: () => void;
  onNavigateProduction: (
    section: AdminProductionSection,
    options?: AdminProductionNavigateOptions,
  ) => void;
  onOpenClient: (clientUid: string) => void;
  onOpenWorkspace: (workspaceId: string) => void;
  onOpenDesignLibrary: (options?: {
    workspaceId?: string;
    projectId?: string;
    tab?: 'designs' | 'assets' | 'templates';
  }) => void;
  selectedServicePackageId: string;
  onSelectedServicePackageChange: (packageId: string) => void;
}

const SHARED_OPS_TABS: {
  id: SharedOpsTab;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
}[] = [
  { id: 'requests-enquiries', label: 'Requests & Enquiries', icon: Inbox },
  { id: 'master-studio', label: 'Master Studio & SLA', icon: Clapperboard },
  { id: 'qa-reviews', label: 'QA & Client Reviews', icon: FileCheck2 },
  { id: 'services-packages', label: 'Services & Packages', icon: Package },
];

export const AdminSharedOperations: React.FC<AdminSharedOperationsProps> = ({
  subTab,
  onSubTabChange,
  selectedProjectId,
  selectedProjectTab,
  projectClientFilter,
  projectWorkspaceFilter,
  projectStageFilter,
  projectOverdueOnly,
  onClearProjectFilters,
  onNavigateProduction,
  onOpenClient,
  onOpenWorkspace,
  onOpenDesignLibrary,
  selectedServicePackageId,
  onSelectedServicePackageChange,
}) => {
  const activeTab: SharedOpsTab = SHARED_OPS_TABS.some(t => t.id === subTab)
    ? subTab
    : 'requests-enquiries';

  return (
    <div className="space-y-5">
      {/* Shared Operations Sub-Navigation */}
      <div
        role="tablist"
        aria-label="Shared Operations subsections"
        className="border border-[#1E1E1E] bg-[#0B0B0B] px-2 pt-2 flex flex-wrap items-center gap-1"
      >
        {SHARED_OPS_TABS.map(tab => {
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

      {activeTab === 'requests-enquiries' && (
        <AdminProduction
          section="requests"
          embeddedMode
          initialProjectId={selectedProjectId}
          initialTab={selectedProjectTab}
          onNavigateSection={onNavigateProduction}
          onOpenClient={onOpenClient}
          onOpenWorkspace={onOpenWorkspace}
          onOpenDesignLibrary={onOpenDesignLibrary}
        />
      )}

      {activeTab === 'master-studio' && (
        <AdminProduction
          section="projects"
          embeddedMode
          initialProjectId={selectedProjectId}
          initialTab={selectedProjectTab}
          filterClientUid={projectClientFilter}
          filterWorkspaceId={projectWorkspaceFilter}
          initialStageFilter={projectStageFilter}
          initialOverdueOnly={projectOverdueOnly}
          onClearFilter={onClearProjectFilters}
          onNavigateSection={onNavigateProduction}
          onOpenClient={onOpenClient}
          onOpenWorkspace={onOpenWorkspace}
          onOpenDesignLibrary={onOpenDesignLibrary}
        />
      )}

      {activeTab === 'qa-reviews' && (
        <AdminProduction
          section="reviews"
          embeddedMode
          initialProjectId={selectedProjectId}
          initialTab={selectedProjectTab}
          onNavigateSection={onNavigateProduction}
          onOpenClient={onOpenClient}
          onOpenWorkspace={onOpenWorkspace}
          onOpenDesignLibrary={onOpenDesignLibrary}
        />
      )}

      {activeTab === 'services-packages' && (
        <ServicesPackagesManagement
          initialSelectedPackageId={selectedServicePackageId}
          onSelectedPackageChange={packageId =>
            onSelectedServicePackageChange(packageId || '')
          }
          onOpenWorkspace={onOpenWorkspace}
        />
      )}
    </div>
  );
};

export default AdminSharedOperations;
