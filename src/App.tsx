/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * LYRICAL ENT — Brand & Label Studio
 */

import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/common/Header';
import { Sidebar } from './components/common/Sidebar';
import { QuickActionModal } from './components/modals/QuickActionModal';

// Modules
import { OverviewDashboard } from './components/modules/OverviewDashboard';
import { BrandIdentityManager } from './components/modules/BrandIdentityManager';
import { CorporateDocuments } from './components/modules/CorporateDocuments';
import { ArtistManagement } from './components/modules/ArtistManagement';
import { MusicReleaseManagement } from './components/modules/MusicReleaseManagement';
import { CreativeCampaignStudio } from './components/modules/CreativeCampaignStudio';
import { CreativeTemplateLibrary } from './components/modules/CreativeTemplateLibrary';
import { CelebrationCalendar } from './components/modules/CelebrationCalendar';
import { MusicPromotionStudio } from './components/modules/MusicPromotionStudio';
import { MotionStudio } from './components/modules/MotionStudio';
import { BusinessCardDesigner } from './components/modules/BusinessCardDesigner';
import { DocumentTemplates } from './components/modules/DocumentTemplates';
import { PressMedia } from './components/modules/PressMedia';
import { BloggerWebsiteStudio } from './components/modules/BloggerWebsiteStudio';
import { AssetLibrary } from './components/modules/AssetLibrary';
import { Operations } from './components/modules/Operations';
import { ExportCenter } from './components/modules/ExportCenter';

const MainLayout: React.FC = () => {
  const { activeModule, currentRole, activeWorkspace } = useApp();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const renderModule = () => {
    switch (activeModule) {
      case 'dashboard':
        return <OverviewDashboard />;
      case 'brand':
        return <BrandIdentityManager />;
      case 'documents':
        return <CorporateDocuments />;
      case 'artists':
        return <ArtistManagement />;
      case 'releases':
        return <MusicReleaseManagement />;
      case 'campaigns':
        return <CreativeCampaignStudio />;
      case 'templates':
        return <CreativeTemplateLibrary />;
      case 'celebration':
        return <CelebrationCalendar />;
      case 'promotion':
        return <MusicPromotionStudio />;
      case 'motion':
        return <MotionStudio />;
      case 'cards':
        return <BusinessCardDesigner />;
      case 'press':
        return <PressMedia />;
      case 'blogger':
        return <BloggerWebsiteStudio />;
      case 'assets':
        return <AssetLibrary />;
      case 'operations':
        return <Operations />;
      case 'export':
        return <ExportCenter />;
      default:
        return <OverviewDashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-[#080808] text-[#F3F3F3] flex flex-col antialiased">
      {/* Sidebar Navigation */}
      <Sidebar 
        mobileMenuOpen={mobileMenuOpen} 
        setMobileMenuOpen={setMobileMenuOpen} 
      />

      {/* Main Workspace Frame */}
      <div className="lg:pl-64 flex-1 flex flex-col min-w-0">
        {/* Sticky Top Header */}
        <Header 
          mobileMenuOpen={mobileMenuOpen} 
          setMobileMenuOpen={setMobileMenuOpen} 
        />

        {/* Primary Viewport Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-[1440px] w-full mx-auto">
          {renderModule()}
        </main>

        {/* Clean Monochrome Footer */}
        <footer className="border-t border-[#191919] bg-[#0A0A0A] px-6 py-4 mt-auto no-print">
          <div className="max-w-[1440px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-neutral-400 font-mono">
            <div className="flex items-center gap-2">
              <span className="font-black text-white tracking-tighter">KEEDO<span className="text-[#FF1E1E]">HUB</span></span>
              <span>·</span>
              <span className="text-[10px] font-bold text-neutral-500">{activeWorkspace.name} WORKSPACE</span>
              <span>·</span>
              <span>EST. 2024</span>
            </div>

            <div className="flex items-center gap-4 text-[11px]">
              <span>ACTIVE ROLE: <strong className="text-white font-medium uppercase">{currentRole}</strong></span>
              <span>·</span>
              <span>PLATFORM v1.0</span>
            </div>
          </div>
        </footer>
      </div>

      {/* Quick Action Modal */}
      <QuickActionModal />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainLayout />
    </AppProvider>
  );
}
