/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * KEEDOHUB — Admin HQ Platform Settings & Governance Console
 */

import React from 'react';
import {
  History,
  Lock,
  Settings,
  ShieldCheck,
} from 'lucide-react';
import type { PlatformSettingsTab } from '../../lib/adminHQNavigation';
import { AdminManagement } from './AdminManagement';
import { SecurityAccessManagement } from './SecurityAccessManagement';
import { AuditHistoryManagement } from './AuditHistoryManagement';
import { PlatformSettingsManagement } from './PlatformSettingsManagement';

interface AdminPlatformSettingsConsoleProps {
  subTab: PlatformSettingsTab;
  onSubTabChange: (subTab: PlatformSettingsTab) => void;
}

const SETTINGS_TABS: {
  id: PlatformSettingsTab;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
}[] = [
  { id: 'administrators', label: 'Administrators', icon: ShieldCheck },
  { id: 'security-access', label: 'Security & Access', icon: Lock },
  { id: 'audit-history', label: 'Audit History', icon: History },
  { id: 'platform-settings', label: 'Platform Settings', icon: Settings },
];

export const AdminPlatformSettingsConsole: React.FC<AdminPlatformSettingsConsoleProps> = ({
  subTab,
  onSubTabChange,
}) => {
  const activeTab: PlatformSettingsTab = SETTINGS_TABS.some(t => t.id === subTab)
    ? subTab
    : 'administrators';

  return (
    <div className="space-y-5">
      <div
        role="tablist"
        aria-label="Platform Settings subsections"
        className="border border-[#1E1E1E] bg-[#0B0B0B] px-2 pt-2 flex flex-wrap items-center gap-1"
      >
        {SETTINGS_TABS.map(tab => {
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

      {activeTab === 'administrators' && <AdminManagement />}
      {activeTab === 'security-access' && <SecurityAccessManagement />}
      {activeTab === 'audit-history' && <AuditHistoryManagement />}
      {activeTab === 'platform-settings' && <PlatformSettingsManagement />}
    </div>
  );
};

export default AdminPlatformSettingsConsole;
