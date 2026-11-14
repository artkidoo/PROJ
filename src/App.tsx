/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * LYRICAL ENT — Brand & Label Studio
 */

import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { PublicSite } from './components/public/PublicSite';
import { ClientWorkspace } from './components/client/ClientWorkspace';
import { AdminHQ } from './components/admin/AdminHQ';

const AppContent: React.FC = () => {
  const { appMode, firebaseUser, isAuthLoading, canAccessAdminCenter } = useApp();

  if (isAuthLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#080808] text-sm text-neutral-400">
        Loading KeedoHub…
      </main>
    );
  }

  if (appMode === 'public' || !firebaseUser) {
    return <PublicSite />;
  }
  if (appMode === 'client') {
    return <ClientWorkspace key={firebaseUser.uid} />;
  }
  if ((appMode === 'workspace' || appMode === 'admin') && canAccessAdminCenter) {
    return <AdminHQ key={firebaseUser.uid} />;
  }

  return <PublicSite />;
};

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
