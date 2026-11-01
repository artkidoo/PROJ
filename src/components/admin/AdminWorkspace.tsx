/**
 * KEEDOHUB — Admin Workspace
 * Phase 3A: Admin Foundation & Dashboard
 */
import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../../lib/firebase';

type AdminTab = 'dashboard' | 'clients' | 'projects' | 'production' | 'deliverables' | 'revisions' | 'notifications' | 'portfolio' | 'settings';

const NAV_ITEMS: { id: AdminTab; label: string }[] = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'clients', label: 'Clients' },
  { id: 'projects', label: 'Projects' },
  { id: 'production', label: 'Production Center' },
  { id: 'deliverables', label: 'Deliverables' },
  { id: 'revisions', label: 'Revisions' },
  { id: 'notifications', label: 'Notifications' },
  { id: 'portfolio', label: 'Portfolio & Content' },
  { id: 'settings', label: 'Settings' },
];

export const AdminWorkspace: React.FC = () => {
  const { firebaseUser, logout } = useApp();
  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');
  const [mobileOpen, setMobileOpen] = useState(false);

  const [clientCount, setClientCount] = useState(0);
  const [projectCount, setProjectCount] = useState(0);
  const [pendingReviewCount, setPendingReviewCount] = useState(0);
  const [pendingRevisionCount, setPendingRevisionCount] = useState(0);
  const [completedProjectCount, setCompletedProjectCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribers: (() => void)[] = [];

    const unsubClients = onSnapshot(collection(db, 'clientProfiles'), function(snapshot) {
      setClientCount(snapshot.size);
    });
    unsubscribers.push(unsubClients);

    const unsubProjects = onSnapshot(collection(db, 'clientProjects'), function(snapshot) {
      setProjectCount(snapshot.size);
      const completed = snapshot.docs.filter(function(d) { return d.data().status === 'Completed'; }).length;
      setCompletedProjectCount(completed);
    });
    unsubscribers.push(unsubProjects);

    const unsubDeliverables = onSnapshot(collection(db, 'clientDeliverables'), function(snapshot) {
      const awaiting = snapshot.docs.filter(function(d) {
        const status = d.data().reviewStatus;
        return status === 'Awaiting Review' || status === 'Revised - Awaiting Review';
      }).length;
      setPendingReviewCount(awaiting);
    });
    unsubscribers.push(unsubDeliverables);

    const unsubRevisions = onSnapshot(collection(db, 'revisionRequests'), function(snapshot) {
      const pending = snapshot.docs.filter(function(d) {
        const status = d.data().status;
        return status === 'Submitted' || status === 'In Progress';
      }).length;
      setPendingRevisionCount(pending);
      setLoading(false);
    });
    unsubscribers.push(unsubRevisions);

    return function cleanup() {
      unsubscribers.forEach(function(unsub) { unsub(); });
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#080808] text-[#F3F3F3] flex flex-col antialiased">
      <header className="sticky top-0 z-40 h-16 bg-[#080808]/90 backdrop-blur border-b border-[#1A1A1A] px-4 md:px-8">
        <div className="max-w-[1440px] mx-auto h-full flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden p-2 text-neutral-300 hover:text-white"
              aria-label="Toggle menu"
            >
              {mobileOpen ? '✕' : '☰'}
            </button>
            <span className="text-lg font-black tracking-tighter text-white uppercase">
              KEEDO<span className="text-[#FF1E1E]">HUB</span>
            </span>
            <span className="hidden sm:inline text-neutral-600">/</span>
            <span className="hidden sm:inline text-[11px] font-mono tracking-widest text-neutral-400 uppercase">
              Admin
            </span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-xs text-neutral-400 hidden sm:inline">
              {firebaseUser?.displayName || firebaseUser?.email}
            </span>
            <button
              onClick={() => logout()}
              className="flex items-center gap-2 bg-[#141414] hover:bg-[#1A1A1A] text-white px-3.5 py-1.5 text-xs font-medium rounded border border-[#242424] transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      <div className="flex-1 flex">
        <nav className={`fixed md:static inset-y-0 left-0 z-30 w-64 bg-[#080808] border-r border-[#1A1A1A] transform transition-transform md:transform-none ${mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'} pt-16 md:pt-0`}>
          <div className="p-4 space-y-1">
            {NAV_ITEMS.map((item) => (
              <button
                key={item.id}
                onClick={() => { setActiveTab(item.id); setMobileOpen(false); }}
                className={`w-full text-left px-3 py-2 text-sm rounded transition-colors ${
                  activeTab === item.id
                    ? 'bg-[#141414] text-white'
                    : 'text-neutral-400 hover:text-white hover:bg-[#0C0C0C]'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </nav>

        {mobileOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-20 md:hidden"
            onClick={() => setMobileOpen(false)}
          />
        )}

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-[1440px] w-full mx-auto">
          {activeTab === 'dashboard' && (
            <div>
              <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white mb-8">
                Admin Dashboard
              </h1>

              {loading ? (
                <div className="flex items-center justify-center py-20">
                  <div className="text-neutral-400 text-sm">Loading...</div>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-12">
                    <div className="bg-[#0C0C0C] border border-[#1A1A1A] rounded p-4">
                      <p className="text-[10px] font-mono tracking-widest uppercase text-neutral-500 mb-1">Total Clients</p>
                      <p className="text-3xl font-black text-white">{clientCount}</p>
                    </div>
                    <div className="bg-[#0C0C0C] border border-[#1A1A1A] rounded p-4">
                      <p className="text-[10px] font-mono tracking-widest uppercase text-neutral-500 mb-1">Active Projects</p>
                      <p className="text-3xl font-black text-white">{projectCount}</p>
                    </div>
                    <div className="bg-[#0C0C0C] border border-[#1A1A1A] rounded p-4">
                      <p className="text-[10px] font-mono tracking-widest uppercase text-neutral-500 mb-1">Awaiting Review</p>
                      <p className="text-3xl font-black text-[#FF1E1E]">{pendingReviewCount}</p>
                    </div>
                    <div className="bg-[#0C0C0C] border border-[#1A1A1A] rounded p-4">
                      <p className="text-[10px] font-mono tracking-widest uppercase text-neutral-500 mb-1">Pending Revisions</p>
                      <p className="text-3xl font-black text-yellow-400">{pendingRevisionCount}</p>
                    </div>
                    <div className="bg-[#0C0C0C] border border-[#1A1A1A] rounded p-4">
                      <p className="text-[10px] font-mono tracking-widest uppercase text-neutral-500 mb-1">Completed</p>
                      <p className="text-3xl font-black text-green-400">{completedProjectCount}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-[#0C0C0C] border border-[#1A1A1A] rounded p-6">
                      <h3 className="text-sm font-bold text-white mb-4">Recent Activity</h3>
                      <div className="space-y-3">
                        <p className="text-neutral-500 text-sm">No recent activity to display.</p>
                        <p className="text-neutral-600 text-xs">Activity will appear here as clients interact with the workspace.</p>
                      </div>
                    </div>
                    <div className="bg-[#0C0C0C] border border-[#1A1A1A] rounded p-6">
                      <h3 className="text-sm font-bold text-white mb-4">Production Overview</h3>
                      <div className="space-y-3">
                        <p className="text-neutral-500 text-sm">No production data to display.</p>
                        <p className="text-neutral-600 text-xs">Project and deliverable data will appear here.</p>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {activeTab !== 'dashboard' && (
            <div>
              <h1 className="text-2xl font-black tracking-tight text-white mb-6">
                {NAV_ITEMS.find((item) => item.id === activeTab)?.label}
              </h1>
              <div className="bg-[#0C0C0C] border border-[#1A1A1A] rounded p-12 text-center">
                <p className="text-neutral-500 text-sm">This section is under development.</p>
                <p className="text-neutral-600 text-xs mt-2">Coming in a future phase.</p>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default AdminWorkspace;