/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * KEEDOHUB — Website & Journal CMS Unified Admin Console
 */
import React, { useState } from 'react';
import {
  FileText,
  Globe,
  Image as ImageIcon,
  Layout,
  Menu,
  Monitor,
  Settings,
} from 'lucide-react';
import { AdminJournalCms } from './AdminJournalCms';
import { AdminHomepageCms } from './AdminHomepageCms';
import { AdminPagesCms } from './AdminPagesCms';
import { AdminNavigationCms } from './AdminNavigationCms';
import { AdminSiteSettingsCms } from './AdminSiteSettingsCms';
import { AdminMediaLibrary } from './AdminMediaLibrary';

export type WebsiteCmsTabId = 'journal' | 'homepage' | 'pages' | 'navigation' | 'settings' | 'media';

const CMS_TABS: Array<{
  id: WebsiteCmsTabId;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
}> = [
  { id: 'journal', label: 'Journal & Blog', icon: FileText },
  { id: 'homepage', label: 'Homepage', icon: Layout },
  { id: 'pages', label: 'Public Pages', icon: Monitor },
  { id: 'navigation', label: 'Navigation & Safeguards', icon: Menu },
  { id: 'settings', label: 'Site Settings', icon: Settings },
  { id: 'media', label: 'Media Library', icon: ImageIcon },
];

export const AdminWebsiteCmsConsole: React.FC = () => {
  const [activeTab, setActiveTab] = useState<WebsiteCmsTabId>('journal');

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#1E1E1E] pb-5">
        <div>
          <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.2em] text-[#FF1E1E]">
            <Globe size={13} />
            <span>Platform Content Management System</span>
          </div>
          <h2 className="text-2xl font-black uppercase tracking-tight text-white mt-1">
            Website &amp; Journal CMS
          </h2>
          <p className="text-xs text-neutral-400 mt-1 max-w-2xl">
            Manage public website content, blog essays, editorial workflows, homepage hero studies, navigation safeguards, and Firebase Storage media assets.
          </p>
        </div>
      </div>

      {/* Sub-tabs header */}
      <div
        role="tablist"
        aria-label="Website CMS tabs"
        className="border border-[#1E1E1E] bg-[#0B0B0B] p-2 flex flex-wrap items-center gap-1.5"
      >
        {CMS_TABS.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => setActiveTab(tab.id)}
              className={`inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold whitespace-nowrap transition-colors ${
                isActive
                  ? 'bg-[#FF1E1E] text-white font-bold'
                  : 'bg-[#121212] text-neutral-400 hover:text-white hover:bg-[#181818]'
              }`}
            >
              <Icon size={14} className={isActive ? 'text-white' : 'text-neutral-500'} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Active Tab Component */}
      <div className="pt-2">
        {activeTab === 'journal' && <AdminJournalCms />}
        {activeTab === 'homepage' && <AdminHomepageCms />}
        {activeTab === 'pages' && <AdminPagesCms />}
        {activeTab === 'navigation' && <AdminNavigationCms />}
        {activeTab === 'settings' && <AdminSiteSettingsCms />}
        {activeTab === 'media' && <AdminMediaLibrary />}
      </div>
    </div>
  );
};

export default AdminWebsiteCmsConsole;
