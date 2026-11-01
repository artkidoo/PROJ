/**
 * KEEDOHUB — Client Workspace
 * Phase 2B: Client Projects, Deliverables & Progress Tracking
 */
import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { collection, query, where, onSnapshot, doc, updateDoc, setDoc } from 'firebase/firestore';
import { db, functions } from '../../lib/firebase';
import { httpsCallable } from 'firebase/functions';
import { ClientProject, ClientDeliverable, ClientNotification, ClientProjectStatus, RevisionRequest } from '../../types';

type ClientTab = 'dashboard' | 'projects' | 'deliverables' | 'notifications' | 'settings';

const statusColors: Record<ClientProjectStatus, string> = {
  'Pending': 'text-neutral-400',
  'Confirmed': 'text-blue-400',
  'In Progress': 'text-[#FF1E1E]',
  'Review': 'text-yellow-400',
  'Completed': 'text-green-400',
  'On Hold': 'text-neutral-500',
};

export const ClientWorkspace: React.FC = () => {
  const { firebaseUser, logout } = useApp();
  const [activeTab, setActiveTab] = useState<ClientTab>('dashboard');
  const [projects, setProjects] = useState<ClientProject[]>([]);
  const [deliverables, setDeliverables] = useState<ClientDeliverable[]>([]);
  const [notifications, setNotifications] = useState<ClientNotification[]>([]);
  const [selectedProject, setSelectedProject] = useState<ClientProject | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reviewingDeliverable, setReviewingDeliverable] = useState<ClientDeliverable | null>(null);
  const [reviewFeedback, setReviewFeedback] = useState('');
  const [reviewAction, setReviewAction] = useState<'approve' | 'revision' | null>(null);
  const [submittingReview, setSubmittingReview] = useState(false);
  const [revisionRequests, setRevisionRequests] = useState<RevisionRequest[]>([]);

  const tabs: { id: ClientTab; label: string }[] = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'projects', label: 'My Projects' },
    { id: 'deliverables', label: 'Deliverables' },
    { id: 'notifications', label: 'Notifications' },
    { id: 'settings', label: 'Settings' },
  ];

  // Real-time listeners for client data
  useEffect(() => {
    if (!firebaseUser) return;

    setLoading(true);
    setError(null);

    const unsubscribers: (() => void)[] = [];

    // Projects listener
    const projectsQuery = query(
      collection(db, 'clientProjects'),
      where('clientUid', '==', firebaseUser.uid)
    );
    const unsubProjects = onSnapshot(projectsQuery, (snapshot) => {
      const data = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as ClientProject));
      setProjects(data);
    }, (err) => {
      console.error('Projects listener error:', err);
      setError('Failed to load projects.');
    });
    unsubscribers.push(unsubProjects);

    // Deliverables listener
    const deliverablesQuery = query(
      collection(db, 'clientDeliverables'),
      where('clientUid', '==', firebaseUser.uid)
    );
    const unsubDeliverables = onSnapshot(deliverablesQuery, (snapshot) => {
      const data = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as ClientDeliverable));
      setDeliverables(data);
    }, (err) => {
      console.error('Deliverables listener error:', err);
      setError('Failed to load deliverables.');
    });
    unsubscribers.push(unsubDeliverables);

    // Notifications listener
    const notificationsQuery = query(
      collection(db, 'clientNotifications'),
      where('clientUid', '==', firebaseUser.uid)
    );
    const unsubNotifications = onSnapshot(notificationsQuery, (snapshot) => {
      const data = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as ClientNotification));
      setNotifications(data.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
      setLoading(false);
    }, (err) => {
      console.error('Notifications listener error:', err);
      setError('Failed to load notifications.');
      setLoading(false);
    });
    // Revision Requests listener
    const revisionRequestsQuery = query(
      collection(db, 'revisionRequests'),
      where('clientUid', '==', firebaseUser.uid)
    );
    const unsubRevisionRequests = onSnapshot(revisionRequestsQuery, (snapshot) => {
      const data = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as RevisionRequest));
      setRevisionRequests(data.sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()));
    }, (err) => {
      console.error('Revision requests listener error:', err);
    });
    unsubscribers.push(unsubRevisionRequests);

    return () => {
      unsubscribers.forEach((unsub) => unsub());
    };
  }, [firebaseUser]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleApprove = async (deliverable: ClientDeliverable) => {
    if (!firebaseUser) return;
    setSubmittingReview(true);
    try {
      const approveFn = httpsCallable(functions, 'approveDeliverable');
      await approveFn({ deliverableId: deliverable.id, feedback: reviewFeedback.trim() || undefined });
      setReviewingDeliverable(null);
      setReviewFeedback('');
      setReviewAction(null);
    } catch (err: any) {
      console.error('Approval error:', err);
      setError(err?.message || 'Failed to approve deliverable. Please try again.');
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleRequestRevision = async (deliverable: ClientDeliverable) => {
    if (!firebaseUser || !reviewFeedback.trim()) return;
    setSubmittingReview(true);
    try {
      const requestRevisionFn = httpsCallable(functions, 'requestRevision');
      await requestRevisionFn({ deliverableId: deliverable.id, feedback: reviewFeedback.trim() });
      setReviewingDeliverable(null);
      setReviewFeedback('');
      setReviewAction(null);
    } catch (err: any) {
      console.error('Revision request error:', err);
      setError(err?.message || 'Failed to submit revision request. Please try again.');
    } finally {
      setSubmittingReview(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      await updateDoc(doc(db, 'clientNotifications', notificationId), { read: true });
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    }
  };

  const handleRetry = () => {
    setError(null);
    setLoading(true);
    // Re-trigger by toggling firebaseUser dependency
    // The useEffect will re-run when firebaseUser changes
  };

  return (
    <div className="min-h-screen bg-[#080808] text-[#F3F3F3] flex flex-col antialiased">
      <header className="sticky top-0 z-40 h-16 bg-[#080808]/90 backdrop-blur border-b border-[#1A1A1A] px-4 md:px-8">
        <div className="max-w-[1440px] mx-auto h-full flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-lg font-black tracking-tighter text-white uppercase">
              KEEDO<span className="text-[#FF1E1E]">HUB</span>
            </span>
            <span className="hidden sm:inline text-neutral-600">/</span>
            <span className="hidden sm:inline text-[11px] font-mono tracking-widest text-neutral-400 uppercase">
              Client Workspace
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
        <nav className="hidden md:flex flex-col w-56 border-r border-[#1A1A1A] px-4 py-6 gap-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`text-left px-3 py-2 text-sm rounded transition-colors ${
                activeTab === tab.id
                  ? 'bg-[#141414] text-white'
                  : 'text-neutral-400 hover:text-white hover:bg-[#0C0C0C]'
              }`}
            >
              {tab.label}
              {tab.id === 'notifications' && unreadCount > 0 && (
                <span className="ml-2 bg-[#FF1E1E] text-white text-[10px] px-1.5 py-0.5 rounded-full">
                  {unreadCount}
                </span>
              )}
            </button>
          ))}
        </nav>

        <div className="md:hidden flex overflow-x-auto border-b border-[#1A1A1A] px-4 gap-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`whitespace-nowrap px-3 py-2 text-xs rounded transition-colors ${
                activeTab === tab.id
                  ? 'bg-[#141414] text-white'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-[1440px] w-full mx-auto">
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm px-4 py-3 rounded mb-6 flex items-center justify-between">
              <span>{error}</span>
              <button onClick={handleRetry} className="text-xs underline hover:text-red-300">Retry</button>
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="text-neutral-400 text-sm">Loading...</div>
            </div>
          ) : (
            <>
              {activeTab === 'dashboard' && (
                <div>
                  <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white mb-2">
                    Welcome back{firebaseUser?.displayName ? `, ${firebaseUser.displayName}` : ''}
                  </h1>
                  <p className="text-neutral-400 text-sm mb-8">Your client workspace overview.</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div className="bg-[#0C0C0C] border border-[#1A1A1A] rounded p-6">
                      <h3 className="text-sm font-bold text-white mb-2">My Projects</h3>
                      <p className="text-3xl font-black text-[#FF1E1E]">{projects.length}</p>
                      <p className="text-xs text-neutral-500 mt-1">Active projects</p>
                    </div>
                    <div className="bg-[#0C0C0C] border border-[#1A1A1A] rounded p-6">
                      <h3 className="text-sm font-bold text-white mb-2">Deliverables</h3>
                      <p className="text-3xl font-black text-[#FF1E1E]">{deliverables.length}</p>
                      <p className="text-xs text-neutral-500 mt-1">Published deliverables</p>
                    </div>
                    <div className="bg-[#0C0C0C] border border-[#1A1A1A] rounded p-6">
                      <h3 className="text-sm font-bold text-white mb-2">Notifications</h3>
                      <p className="text-3xl font-black text-[#FF1E1E]">{unreadCount}</p>
                      <p className="text-xs text-neutral-500 mt-1">Unread</p>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'projects' && !selectedProject && (
                <div>
                  <h2 className="text-2xl font-black tracking-tight text-white mb-6">My Projects</h2>
                  {projects.length === 0 ? (
                    <div className="bg-[#0C0C0C] border border-[#1A1A1A] rounded p-12 text-center">
                      <p className="text-neutral-500 text-sm">No projects yet.</p>
                      <p className="text-neutral-600 text-xs mt-2">Your projects will appear here once created by our team.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {projects.map((project) => (
                        <div
                          key={project.id}
                          onClick={() => setSelectedProject(project)}
                          className="bg-[#0C0C0C] border border-[#1A1A1A] rounded p-6 cursor-pointer hover:border-[#FF1E1E]/30 transition-colors"
                        >
                          <div className="flex items-start justify-between mb-3">
                            <h3 className="text-lg font-bold text-white">{project.title}</h3>
                            <span className={`text-[10px] font-mono tracking-widest uppercase ${statusColors[project.status]}`}>
                              {project.status}
                            </span>
                          </div>
                          <p className="text-neutral-500 text-sm mb-4 line-clamp-2">{project.description}</p>
                          <div className="flex items-center gap-3">
                            <div className="flex-1 h-1.5 bg-[#1A1A1A] rounded-full overflow-hidden">
                              <div className="h-full bg-[#FF1E1E] rounded-full transition-all" style={{ width: `${project.progress}%` }} />
                            </div>
                            <span className="text-xs text-neutral-400">{project.progress}%</span>
                          </div>
                          <p className="text-[10px] text-neutral-600 mt-3">
                            Due: {new Date(project.expectedDeliveryDate).toLocaleDateString()}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
              {activeTab === 'projects' && selectedProject && (
                <div>
                  <button
                    onClick={() => setSelectedProject(null)}
                    className="text-[#FF1E1E] hover:text-white transition-colors text-sm mb-6 flex items-center gap-2"
                  >
                    ← Back to Projects
                  </button>
                  <h2 className="text-2xl font-black tracking-tight text-white mb-2">{selectedProject.title}</h2>
                  <p className="text-neutral-400 text-sm mb-6">{selectedProject.description}</p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    <div className="bg-[#0C0C0C] border border-[#1A1A1A] rounded p-4">
                      <label className="text-[10px] font-mono tracking-widest uppercase text-neutral-500 block mb-1">Status</label>
                      <p className={`text-sm font-bold ${statusColors[selectedProject.status]}`}>{selectedProject.status}</p>
                    </div>
                    <div className="bg-[#0C0C0C] border border-[#1A1A1A] rounded p-4">
                      <label className="text-[10px] font-mono tracking-widest uppercase text-neutral-500 block mb-1">Progress</label>
                      <div className="flex items-center gap-3">
                        <div className="flex-1 h-2 bg-[#1A1A1A] rounded-full overflow-hidden">
                          <div className="h-full bg-[#FF1E1E] rounded-full transition-all" style={{ width: `${selectedProject.progress}%` }} />
                        </div>
                        <span className="text-sm font-bold text-white">{selectedProject.progress}%</span>
                      </div>
                    </div>
                    <div className="bg-[#0C0C0C] border border-[#1A1A1A] rounded p-4">
                      <label className="text-[10px] font-mono tracking-widest uppercase text-neutral-500 block mb-1">Start Date</label>
                      <p className="text-white text-sm">{new Date(selectedProject.startDate).toLocaleDateString()}</p>
                    </div>
                    <div className="bg-[#0C0C0C] border border-[#1A1A1A] rounded p-4">
                      <label className="text-[10px] font-mono tracking-widest uppercase text-neutral-500 block mb-1">Expected Delivery</label>
                      <p className="text-white text-sm">{new Date(selectedProject.expectedDeliveryDate).toLocaleDateString()}</p>
                    </div>
                  </div>

                  {selectedProject.milestones && selectedProject.milestones.length > 0 && (
                    <div className="mb-8">
                      <h3 className="text-lg font-bold text-white mb-4">Milestones</h3>
                      <div className="space-y-3">
                        {selectedProject.milestones.map((m, i) => (
                          <div key={i} className="flex items-center gap-3 text-sm">
                            <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${m.completed ? 'bg-[#FF1E1E] border-[#FF1E1E]' : 'border-[#242424]'}`}>
                              {m.completed && <span className="text-white text-[8px]">✓</span>}
                            </div>
                            <span className={m.completed ? 'text-white' : 'text-neutral-500'}>{m.title}</span>
                            {m.date && <span className="text-[10px] text-neutral-600 ml-auto">{new Date(m.date).toLocaleDateString()}</span>}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedProject.recentUpdates && selectedProject.recentUpdates.length > 0 && (
                    <div>
                      <h3 className="text-lg font-bold text-white mb-4">Recent Updates</h3>
                      <div className="space-y-3">
                        {selectedProject.recentUpdates.map((u, i) => (
                          <div key={i} className="bg-[#0C0C0C] border border-[#1A1A1A] rounded p-4">
                            <p className="text-neutral-400 text-sm">{u.message}</p>
                            <span className="text-[10px] text-neutral-600 mt-1 block">{new Date(u.date).toLocaleDateString()}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
              {activeTab === 'deliverables' && (
                <div>
                  <h2 className="text-2xl font-black tracking-tight text-white mb-6">My Deliverables</h2>
                  {deliverables.length === 0 ? (
                    <div className="bg-[#0C0C0C] border border-[#1A1A1A] rounded p-12 text-center">
                      <p className="text-neutral-500 text-sm">No deliverables yet.</p>
                      <p className="text-neutral-600 text-xs mt-2">Deliverables will appear here once published by our team.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {deliverables.map((del) => (
                        <div key={del.id} className="bg-[#0C0C0C] border border-[#1A1A1A] rounded overflow-hidden">
                          {del.thumbnailUrl ? (
                            <img src={del.thumbnailUrl} alt={del.title} className="w-full h-40 object-cover" />
                          ) : (
                            <div className="w-full h-40 bg-[#141414] flex items-center justify-center">
                              <span className="text-neutral-600 text-xs font-mono uppercase">{del.fileType}</span>
                            </div>
                          )}
                          <div className="p-4">
                            <h3 className="text-sm font-bold text-white mb-1">{del.title}</h3>
                            <p className="text-neutral-500 text-xs mb-3">{del.description}</p>
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-mono tracking-widest uppercase text-neutral-600">{del.category}</span>
                              {del.fileUrl && (
                                <a href={del.fileUrl} target="_blank" rel="noopener noreferrer" className="text-[#FF1E1E] hover:text-white text-xs transition-colors">
                                  Download
                                </a>
                              )}
                            </div>
                            {del.publishedDate && (
                              <p className="text-[10px] text-neutral-600 mt-2">
                                Published: {new Date(del.publishedDate).toLocaleDateString()}
                              </p>
                            )}
                            {/* Review Status & Actions */}
                            <div className="mt-3 pt-3 border-t border-[#1A1A1A]">
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-[10px] font-mono tracking-widest uppercase text-neutral-600">Review Status</span>
                                <span className={`text-[10px] font-mono tracking-widest uppercase ${
                                  del.reviewStatus === 'Approved' ? 'text-green-400' :
                                  del.reviewStatus === 'Revision Requested' ? 'text-yellow-400' :
                                  del.reviewStatus === 'Revision In Progress' ? 'text-blue-400' :
                                  'text-neutral-400'
                                }`}>{del.reviewStatus || 'Awaiting Review'}</span>
                              </div>
                              {del.approval && (
                                <p className="text-[10px] text-neutral-600 mb-2">
                                  Approved on {new Date(del.approval.approvedAt).toLocaleDateString()}
                                </p>
                              )}
                              {del.reviewStatus !== 'Approved' && del.reviewStatus !== 'Revision Requested' && (
                                <div className="flex gap-2 mt-2">
                                  <button
                                    onClick={() => { setReviewingDeliverable(del); setReviewAction('approve'); }}
                                    className="text-xs bg-green-500/10 text-green-400 border border-green-500/20 px-3 py-1 rounded hover:bg-green-500/20 transition-colors"
                                  >
                                    Approve
                                  </button>
                                  <button
                                    onClick={() => { setReviewingDeliverable(del); setReviewAction('revision'); }}
                                    className="text-xs bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 px-3 py-1 rounded hover:bg-yellow-500/20 transition-colors"
                                  >
                                    Request Revision
                                  </button>
                                </div>
                              )}
                              {del.versions && del.versions.length > 1 && (
                                <div className="mt-3">
                                  <p className="text-[10px] font-mono tracking-widest uppercase text-neutral-600 mb-1">Versions: {del.versions.length}</p>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
              {activeTab === 'notifications' && (
                <div>
                  <h2 className="text-2xl font-black tracking-tight text-white mb-6">Notifications</h2>
                  {notifications.length === 0 ? (
                    <div className="bg-[#0C0C0C] border border-[#1A1A1A] rounded p-12 text-center">
                      <p className="text-neutral-500 text-sm">No notifications.</p>
                      <p className="text-neutral-600 text-xs mt-2">You will be notified here when updates are available.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {notifications.map((notif) => (
                        <div
                          key={notif.id}
                          className={`bg-[#0C0C0C] border rounded p-4 transition-colors ${notif.read ? 'border-[#1A1A1A]' : 'border-[#FF1E1E]/30'}`}
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <h3 className={`text-sm font-bold ${notif.read ? 'text-neutral-400' : 'text-white'}`}>{notif.title}</h3>
                              <p className="text-neutral-500 text-xs mt-1">{notif.message}</p>
                              <span className="text-[10px] text-neutral-600 mt-2 block">{new Date(notif.createdAt).toLocaleDateString()}</span>
                            </div>
                            {!notif.read && (
                              <button
                                onClick={() => markAsRead(notif.id)}
                                className="text-[10px] text-[#FF1E1E] hover:text-white transition-colors whitespace-nowrap"
                              >
                                Mark read
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'settings' && (
                <div>
                  <h2 className="text-2xl font-black tracking-tight text-white mb-6">Account Settings</h2>
                  <div className="bg-[#0C0C0C] border border-[#1A1A1A] rounded p-6 max-w-lg">
                    <div className="space-y-4">
                      <div>
                        <label className="text-[10px] font-mono tracking-widest uppercase text-neutral-500 block mb-1">Email</label>
                        <p className="text-white text-sm">{firebaseUser?.email}</p>
                      </div>
                      <div>
                        <label className="text-[10px] font-mono tracking-widest uppercase text-neutral-500 block mb-1">Account Status</label>
                        <p className="text-white text-sm">Active</p>
                      </div>
                      <div className="pt-4">
                        <button
                          onClick={() => logout()}
                          className="bg-[#FF1E1E] hover:bg-[#E01E1E] text-white px-6 py-2 rounded text-sm font-medium transition-colors"
                        >
                          Sign Out
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
          {/* Review Dialog */}
          {reviewingDeliverable && reviewAction && (
            <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center px-4">
              <div className="bg-[#0C0C0C] border border-[#1A1A1A] rounded-lg p-6 max-w-lg w-full">
                <h3 className="text-xl font-bold text-white mb-4">
                  {reviewAction === 'approve' ? 'Approve Deliverable' : 'Request Revision'}
                </h3>
                <p className="text-neutral-400 text-sm mb-4">
                  {reviewAction === 'approve'
                    ? `You are approving "${reviewingDeliverable.title}". This confirms the deliverable is satisfactory.`
                    : `You are requesting revisions for "${reviewingDeliverable.title}". Please describe the changes needed.`}
                </p>
                <textarea
                  value={reviewFeedback}
                  onChange={(e) => setReviewFeedback(e.target.value)}
                  className="w-full bg-[#141414] border border-[#222] text-white px-4 py-3 rounded text-sm focus:border-[#FF1E1E] focus:outline-none transition-colors min-h-[100px] resize-y"
                  placeholder={reviewAction === 'approve' ? 'Optional feedback...' : 'Describe the requested changes (required)...'}
                  required={reviewAction === 'revision'}
                />
                <div className="flex justify-end gap-3 mt-4">
                  <button
                    onClick={() => {
                      setReviewingDeliverable(null);
                      setReviewFeedback('');
                      setReviewAction(null);
                    }}
                    className="px-4 py-2 text-sm text-neutral-400 hover:text-white transition-colors"
                    disabled={submittingReview}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      if (reviewAction === 'approve') {
                        handleApprove(reviewingDeliverable);
                      } else {
                        handleRequestRevision(reviewingDeliverable);
                      }
                    }}
                    disabled={submittingReview || (reviewAction === 'revision' && !reviewFeedback.trim())}
                    className={`px-4 py-2 text-sm font-medium rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                      reviewAction === 'approve'
                        ? 'bg-green-500 hover:bg-green-600 text-white'
                        : 'bg-[#FF1E1E] hover:bg-[#E01E1E] text-white'
                    }`}
                  >
                    {submittingReview ? 'Submitting...' : reviewAction === 'approve' ? 'Confirm Approval' : 'Submit Revision Request'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default ClientWorkspace;