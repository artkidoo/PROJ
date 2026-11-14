import React, { useEffect, useMemo, useState } from 'react';
import {
  collection,
  collectionGroup,
  limit,
  onSnapshot,
  orderBy,
  query,
} from 'firebase/firestore';
import {
  ArrowRight,
  Building2,
  FileCheck2,
  FolderKanban,
  Inbox,
  ShieldAlert,
  Users,
} from 'lucide-react';
import { db } from '../../lib/firebase';
import { useApp } from '../../context/AppContext';
import {
  ClientProfile,
  ClientProject,
  ProductionDeliverable,
  ProductionRevisionRequest,
  Workspace,
} from '../../types';

export type AdminHQOverviewTarget =
  | 'clients-accounts'
  | 'workspaces'
  | 'projects'
  | 'deliverables-reviews'
  | 'creative-requests'
  | 'audit-history';

interface ServiceEnquirySummary {
  id: string;
  name: string;
  email: string;
  service: string;
  status: 'New' | 'In Review' | 'Contacted' | 'Closed' | 'Converted';
  createdAt: string;
}

interface AuditLogSummary {
  id: string;
  actor: string;
  action: string;
  target: string;
  details: string;
  createdAt: string;
}

interface AdminHQOverviewProps {
  onNavigate: (target: AdminHQOverviewTarget, projectId?: string) => void;
}

export const AdminHQOverview: React.FC<AdminHQOverviewProps> = ({ onNavigate }) => {
  const { firebaseUser, canAccessAdminCenter } = useApp();

  const [clients, setClients] = useState<ClientProfile[]>([]);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [projects, setProjects] = useState<ClientProject[]>([]);
  const [deliverables, setDeliverables] = useState<ProductionDeliverable[]>([]);
  const [revisions, setRevisions] = useState<ProductionRevisionRequest[]>([]);
  const [enquiries, setEnquiries] = useState<ServiceEnquirySummary[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogSummary[]>([]);

  const [loadingStates, setLoadingStates] = useState({
    clients: true,
    workspaces: true,
    projects: true,
    deliverables: true,
    revisions: true,
    enquiries: true,
    auditLogs: true,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!firebaseUser || !canAccessAdminCenter) {
      setClients([]);
      setWorkspaces([]);
      setProjects([]);
      setDeliverables([]);
      setRevisions([]);
      setEnquiries([]);
      setAuditLogs([]);
      return;
    }

    setLoadingStates({
      clients: true,
      workspaces: true,
      projects: true,
      deliverables: true,
      revisions: true,
      enquiries: true,
      auditLogs: true,
    });
    setErrors({});

    const markLoaded = (key: keyof typeof loadingStates) => {
      setLoadingStates(prev => (prev[key] ? { ...prev, [key]: false } : prev));
    };

    const recordError = (key: string, err: { message?: string }) => {
      setErrors(prev => ({ ...prev, [key]: err?.message || `Unable to load ${key}.` }));
      setLoadingStates(prev => ({ ...prev, [key]: false }));
    };

    const unsubscribers = [
      onSnapshot(
        collection(db, 'clientProfiles'),
        snapshot => {
          setClients(
            snapshot.docs.map(item => ({ ...(item.data() as ClientProfile), uid: item.id }))
          );
          markLoaded('clients');
        },
        err => recordError('clients', err)
      ),
      onSnapshot(
        collection(db, 'workspaces'),
        snapshot => {
          setWorkspaces(
            snapshot.docs.map(item => ({ ...(item.data() as Workspace), id: item.id }))
          );
          markLoaded('workspaces');
        },
        err => recordError('workspaces', err)
      ),
      onSnapshot(
        query(collection(db, 'clientProjects'), orderBy('updatedAt', 'desc')),
        snapshot => {
          setProjects(
            snapshot.docs.map(item => ({ ...(item.data() as ClientProject), id: item.id }))
          );
          markLoaded('projects');
        },
        err => recordError('projects', err)
      ),
      onSnapshot(
        collectionGroup(db, 'deliverables'),
        snapshot => {
          setDeliverables(
            snapshot.docs.map(
              item => ({ ...(item.data() as ProductionDeliverable), id: item.id })
            )
          );
          markLoaded('deliverables');
        },
        err => recordError('deliverables', err)
      ),
      onSnapshot(
        collectionGroup(db, 'revisionRequests'),
        snapshot => {
          setRevisions(
            snapshot.docs.map(
              item => ({ ...(item.data() as ProductionRevisionRequest), id: item.id })
            )
          );
          markLoaded('revisions');
        },
        err => recordError('revisions', err)
      ),
      onSnapshot(
        query(collection(db, 'serviceEnquiries'), orderBy('createdAt', 'desc'), limit(20)),
        snapshot => {
          setEnquiries(
            snapshot.docs.map(
              item => ({ ...(item.data() as ServiceEnquirySummary), id: item.id })
            )
          );
          markLoaded('enquiries');
        },
        err => recordError('enquiries', err)
      ),
      onSnapshot(
        query(collection(db, 'adminAuditLogs'), orderBy('createdAt', 'desc'), limit(12)),
        snapshot => {
          setAuditLogs(
            snapshot.docs.map(item => {
              const data = item.data() as Record<string, unknown>;
              return {
                id: item.id,
                actor: String(data.actorName || data.actorUid || 'System'),
                action: String(data.action || 'Admin action'),
                target: String(data.targetUid || data.target || data.entityType || 'Platform'),
                details:
                  typeof data.details === 'string'
                    ? data.details
                    : JSON.stringify(data.details ?? {}),
                createdAt: String(data.createdAt || ''),
              };
            })
          );
          markLoaded('auditLogs');
        },
        err => recordError('auditLogs', err)
      ),
    ];

    return () => unsubscribers.forEach(unsubscribe => unsubscribe());
  }, [firebaseUser, canAccessAdminCenter]);

  const metrics = useMemo(() => {
    const activeClients = clients.filter(c => c.status !== 'Suspended').length;
    const suspendedClients = clients.filter(c => c.status === 'Suspended').length;
    const onboardingIncomplete = clients.filter(c => !c.onboardingComplete).length;

    const activeWorkspaces = workspaces.filter(
      w => !w.status || w.status === 'Active' || w.status === 'Onboarding'
    ).length;

    const activeProjects = projects.filter(p => p.stage !== 'Delivered');
    const awaitingProduction = projects.filter(
      p => p.stage === 'New Request' || p.stage === 'Brief Approved'
    );
    const pendingRequests = projects.filter(
      p =>
        p.requestStatus === 'Pending' ||
        p.requestStatus === 'Clarification Requested' ||
        (!p.requestStatus && p.stage === 'New Request')
    );

    const openEnquiries = enquiries.filter(
      e => e.status !== 'Closed' && e.status !== 'Converted'
    );

    const deliverablesAwaitingReview = deliverables.filter(d =>
      ['Awaiting Review', 'Revised - Awaiting Review'].includes(d.reviewStatus)
    );

    const pendingRevisions = revisions.filter(r =>
      ['Submitted', 'In Progress'].includes(r.status)
    );

    return {
      totalClients: clients.length,
      activeClients,
      suspendedClients,
      onboardingIncomplete,
      totalWorkspaces: workspaces.length,
      activeWorkspaces,
      activeProjectsCount: activeProjects.length,
      awaitingProductionCount: awaitingProduction.length,
      deliveredProjectsCount: projects.length - activeProjects.length,
      pendingRequests,
      openEnquiries,
      deliverablesAwaitingReview,
      pendingRevisions,
    };
  }, [clients, workspaces, projects, enquiries, deliverables, revisions]);

  if (!firebaseUser || !canAccessAdminCenter) {
    return (
      <div className="border border-red-900/50 bg-[#0C0C0C] p-6 text-sm text-red-300 flex items-center gap-3">
        <ShieldAlert size={18} className="text-[#FF1E1E] shrink-0" />
        <span>Authorized platform administrator access is required to view Admin HQ Overview.</span>
      </div>
    );
  }

  const errorEntries = Object.entries(errors);
  const initialLoading =
    loadingStates.clients &&
    loadingStates.workspaces &&
    loadingStates.projects &&
    loadingStates.deliverables &&
    loadingStates.revisions &&
    loadingStates.auditLogs;

  return (
    <div className="space-y-6">
      {errorEntries.length > 0 && (
        <div role="alert" className="border border-red-900/50 bg-red-950/20 p-4 text-xs text-red-200 space-y-1">
          {errorEntries.map(([source, message]) => (
            <p key={source}>
              <span className="font-mono uppercase text-red-400">{source}:</span> {message}
            </p>
          ))}
        </div>
      )}

      {/* Primary KPI Grid */}
      <section aria-label="Platform operational metrics">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
          {/* Clients */}
          <button
            type="button"
            onClick={() => onNavigate('clients-accounts')}
            className="text-left bg-[#0C0C0C] border border-[#1E1E1E] hover:border-[#333333] p-4 transition-colors group"
          >
            <div className="flex items-center justify-between text-neutral-400">
              <span className="text-[11px] font-mono uppercase tracking-wider">Registered Clients</span>
              <Users size={15} className="text-neutral-500 group-hover:text-white transition-colors" />
            </div>
            <div className="mt-2 text-2xl font-bold font-mono tabular-nums text-white">
              {loadingStates.clients ? '—' : metrics.totalClients}
            </div>
            <div className="mt-2 text-xs text-neutral-400 font-mono tabular-nums">
              {loadingStates.clients
                ? 'Loading profiles…'
                : `${metrics.activeClients} active · ${metrics.suspendedClients} suspended`}
            </div>
          </button>

          {/* Workspaces */}
          <button
            type="button"
            onClick={() => onNavigate('workspaces')}
            className="text-left bg-[#0C0C0C] border border-[#1E1E1E] hover:border-[#333333] p-4 transition-colors group"
          >
            <div className="flex items-center justify-between text-neutral-400">
              <span className="text-[11px] font-mono uppercase tracking-wider">Workspaces</span>
              <Building2 size={15} className="text-neutral-500 group-hover:text-white transition-colors" />
            </div>
            <div className="mt-2 text-2xl font-bold font-mono tabular-nums text-white">
              {loadingStates.workspaces ? '—' : metrics.totalWorkspaces}
            </div>
            <div className="mt-2 text-xs text-neutral-400 font-mono tabular-nums">
              {loadingStates.workspaces
                ? 'Loading workspaces…'
                : `${metrics.activeWorkspaces} active or onboarding`}
            </div>
          </button>

          {/* Active Projects */}
          <button
            type="button"
            onClick={() => onNavigate('projects')}
            className="text-left bg-[#0C0C0C] border border-[#1E1E1E] hover:border-[#333333] p-4 transition-colors group"
          >
            <div className="flex items-center justify-between text-neutral-400">
              <span className="text-[11px] font-mono uppercase tracking-wider">Active Projects</span>
              <FolderKanban size={15} className="text-neutral-500 group-hover:text-white transition-colors" />
            </div>
            <div className="mt-2 text-2xl font-bold font-mono tabular-nums text-white">
              {loadingStates.projects ? '—' : metrics.activeProjectsCount}
            </div>
            <div className="mt-2 text-xs text-neutral-400 font-mono tabular-nums">
              {loadingStates.projects
                ? 'Loading projects…'
                : `${metrics.awaitingProductionCount} awaiting production · ${metrics.deliveredProjectsCount} delivered`}
            </div>
          </button>

          {/* Creative Requests & Enquiries */}
          <button
            type="button"
            onClick={() => onNavigate('creative-requests')}
            className="text-left bg-[#0C0C0C] border border-[#1E1E1E] hover:border-[#333333] p-4 transition-colors group"
          >
            <div className="flex items-center justify-between text-neutral-400">
              <span className="text-[11px] font-mono uppercase tracking-wider">Creative Requests</span>
              <Inbox size={15} className="text-neutral-500 group-hover:text-white transition-colors" />
            </div>
            <div className="mt-2 text-2xl font-bold font-mono tabular-nums text-white">
              {loadingStates.projects || loadingStates.enquiries
                ? '—'
                : metrics.pendingRequests.length + metrics.openEnquiries.length}
            </div>
            <div className="mt-2 text-xs text-neutral-400 font-mono tabular-nums">
              {loadingStates.projects || loadingStates.enquiries
                ? 'Loading requests…'
                : `${metrics.pendingRequests.length} client briefs · ${metrics.openEnquiries.length} enquiries`}
            </div>
          </button>

          {/* Deliverables & Revisions Queue */}
          <button
            type="button"
            onClick={() => onNavigate('deliverables-reviews')}
            className="text-left bg-[#0C0C0C] border border-[#1E1E1E] hover:border-[#333333] p-4 transition-colors group"
          >
            <div className="flex items-center justify-between text-neutral-400">
              <span className="text-[11px] font-mono uppercase tracking-wider">Review Queue</span>
              <FileCheck2 size={15} className="text-neutral-500 group-hover:text-white transition-colors" />
            </div>
            <div className="mt-2 text-2xl font-bold font-mono tabular-nums text-white">
              {loadingStates.deliverables || loadingStates.revisions
                ? '—'
                : metrics.deliverablesAwaitingReview.length + metrics.pendingRevisions.length}
            </div>
            <div className="mt-2 text-xs text-neutral-400 font-mono tabular-nums">
              {loadingStates.deliverables || loadingStates.revisions
                ? 'Loading queue…'
                : `${metrics.deliverablesAwaitingReview.length} deliverables · ${metrics.pendingRevisions.length} revisions`}
            </div>
          </button>
        </div>
      </section>

      {/* Operational Queues */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending Creative Requests & Public Enquiries */}
        <div className="bg-[#0C0C0C] border border-[#1E1E1E]">
          <div className="px-5 py-4 border-b border-[#1E1E1E] flex items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-bold text-white">Pending Requests & Enquiries</h2>
              <p className="text-xs text-neutral-400 mt-0.5">
                Client project briefs and public service enquiries requiring review.
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('creative-requests')}
              className="text-xs font-medium text-[#FF1E1E] hover:text-red-400 inline-flex items-center gap-1 shrink-0"
            >
              <span>Open Queue</span>
              <ArrowRight size={13} />
            </button>
          </div>

          <div className="divide-y divide-[#171717]">
            {loadingStates.projects && loadingStates.enquiries ? (
              <div className="p-5 space-y-2.5">
                <div className="h-9 bg-[#141414]" />
                <div className="h-9 bg-[#141414]" />
              </div>
            ) : metrics.pendingRequests.length === 0 && metrics.openEnquiries.length === 0 ? (
              <div className="p-6 text-xs text-neutral-500">
                No pending client creative requests or open public enquiries.
              </div>
            ) : (
              <>
                {metrics.pendingRequests.slice(0, 4).map(project => (
                  <button
                    key={project.id}
                    type="button"
                    onClick={() => onNavigate('creative-requests', project.id)}
                    className="w-full px-5 py-3 text-left hover:bg-[#121212] transition-colors flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-white truncate">{project.title}</p>
                      <p className="text-[11px] text-neutral-400 mt-0.5 truncate">
                        Client brief · {project.category} · {project.requestStatus || 'Pending review'}
                      </p>
                    </div>
                    <span className="text-[11px] font-mono tabular-nums text-amber-400 shrink-0">
                      {new Date(project.createdAt).toLocaleDateString()}
                    </span>
                  </button>
                ))}
                {metrics.openEnquiries.slice(0, 3).map(enquiry => (
                  <button
                    key={enquiry.id}
                    type="button"
                    onClick={() => onNavigate('creative-requests')}
                    className="w-full px-5 py-3 text-left hover:bg-[#121212] transition-colors flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-white truncate">
                        {enquiry.name} · {enquiry.service}
                      </p>
                      <p className="text-[11px] text-neutral-400 mt-0.5 truncate">
                        Public enquiry · {enquiry.email} · {enquiry.status}
                      </p>
                    </div>
                    <span className="text-[11px] font-mono tabular-nums text-neutral-400 shrink-0">
                      {new Date(enquiry.createdAt).toLocaleDateString()}
                    </span>
                  </button>
                ))}
              </>
            )}
          </div>
        </div>

        {/* Deliverables Awaiting Review & Pending Revisions */}
        <div className="bg-[#0C0C0C] border border-[#1E1E1E]">
          <div className="px-5 py-4 border-b border-[#1E1E1E] flex items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-bold text-white">Deliverables & Revisions Queue</h2>
              <p className="text-xs text-neutral-400 mt-0.5">
                Published deliverables awaiting client sign-off and active revision requests.
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('deliverables-reviews')}
              className="text-xs font-medium text-[#FF1E1E] hover:text-red-400 inline-flex items-center gap-1 shrink-0"
            >
              <span>Review Queue</span>
              <ArrowRight size={13} />
            </button>
          </div>

          <div className="divide-y divide-[#171717]">
            {loadingStates.deliverables && loadingStates.revisions ? (
              <div className="p-5 space-y-2.5">
                <div className="h-9 bg-[#141414]" />
                <div className="h-9 bg-[#141414]" />
              </div>
            ) : metrics.deliverablesAwaitingReview.length === 0 &&
              metrics.pendingRevisions.length === 0 ? (
              <div className="p-6 text-xs text-neutral-500">
                No deliverables awaiting review or outstanding revisions.
              </div>
            ) : (
              <>
                {metrics.pendingRevisions.slice(0, 4).map(revision => {
                  const projectTitle =
                    projects.find(p => p.id === revision.projectId)?.title || 'Project';
                  return (
                    <button
                      key={revision.id}
                      type="button"
                      onClick={() => onNavigate('deliverables-reviews', revision.projectId)}
                      className="w-full px-5 py-3 text-left hover:bg-[#121212] transition-colors flex items-center justify-between gap-3"
                    >
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-white truncate">
                          Revision · {projectTitle}
                        </p>
                        <p className="text-[11px] text-neutral-400 mt-0.5 truncate">
                          {revision.feedback}
                        </p>
                      </div>
                      <span className="text-[11px] font-mono text-amber-400 shrink-0">
                        {revision.status}
                      </span>
                    </button>
                  );
                })}
                {metrics.deliverablesAwaitingReview.slice(0, 4).map(deliverable => {
                  const projectTitle =
                    projects.find(p => p.id === deliverable.projectId)?.title || 'Project';
                  return (
                    <button
                      key={deliverable.id}
                      type="button"
                      onClick={() => onNavigate('deliverables-reviews', deliverable.projectId)}
                      className="w-full px-5 py-3 text-left hover:bg-[#121212] transition-colors flex items-center justify-between gap-3"
                    >
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-white truncate">
                          {deliverable.title}
                        </p>
                        <p className="text-[11px] text-neutral-400 mt-0.5 truncate">
                          {projectTitle} · v{deliverable.currentVersion || 1}
                        </p>
                      </div>
                      <span className="text-[11px] font-mono text-neutral-300 shrink-0">
                        {deliverable.reviewStatus}
                      </span>
                    </button>
                  );
                })}
              </>
            )}
          </div>
        </div>
      </section>

      {/* Recent Platform Activity (adminAuditLogs) */}
      <section className="bg-[#0C0C0C] border border-[#1E1E1E]">
        <div className="px-5 py-4 border-b border-[#1E1E1E] flex items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold text-white">Recent Platform Activity</h2>
            <p className="text-xs text-neutral-400 mt-0.5">
              Latest server-recorded administrative and production audit events.
            </p>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('audit-history')}
            className="text-xs font-medium text-[#FF1E1E] hover:text-red-400 inline-flex items-center gap-1 shrink-0"
          >
            <span>Full Audit Log</span>
            <ArrowRight size={13} />
          </button>
        </div>

        {loadingStates.auditLogs || initialLoading ? (
          <div className="p-5 space-y-2">
            <div className="h-9 bg-[#141414]" />
            <div className="h-9 bg-[#141414]" />
            <div className="h-9 bg-[#141414]" />
          </div>
        ) : auditLogs.length === 0 ? (
          <div className="p-6 text-xs text-neutral-500">
            No administrative audit events recorded yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#111111] text-neutral-400 font-mono border-b border-[#1E1E1E]">
                <tr>
                  <th className="py-2.5 px-4 font-normal">Actor</th>
                  <th className="py-2.5 px-4 font-normal">Action</th>
                  <th className="py-2.5 px-4 font-normal">Target</th>
                  <th className="py-2.5 px-4 font-normal">Details</th>
                  <th className="py-2.5 px-4 font-normal text-right">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#171717]">
                {auditLogs.map(entry => (
                  <tr key={entry.id} className="hover:bg-[#121212] transition-colors">
                    <td className="py-2.5 px-4 text-neutral-200 font-medium whitespace-nowrap">
                      {entry.actor}
                    </td>
                    <td className="py-2.5 px-4 text-white whitespace-nowrap">{entry.action}</td>
                    <td className="py-2.5 px-4 font-mono text-neutral-400 whitespace-nowrap">
                      {entry.target}
                    </td>
                    <td className="py-2.5 px-4 text-neutral-300 max-w-md truncate">
                      {entry.details}
                    </td>
                    <td className="py-2.5 px-4 font-mono tabular-nums text-neutral-400 text-right whitespace-nowrap">
                      {entry.createdAt ? new Date(entry.createdAt).toLocaleString() : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
};

export default AdminHQOverview;
