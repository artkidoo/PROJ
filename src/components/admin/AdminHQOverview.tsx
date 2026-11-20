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
  AlertTriangle,
  ArrowRight,
  Building2,
  CheckCircle2,
  Clock,
  ExternalLink,
  FileCheck2,
  FolderKanban,
  Inbox,
  Layers,
  Plus,
  ShieldAlert,
  Sparkles,
  Users,
} from 'lucide-react';
import { db } from '../../lib/firebase';
import { useApp } from '../../context/AppContext';
import {
  ClientProfile,
  ClientProject,
  ProductionDeliverable,
  ProductionRevisionRequest,
  ProductionStage,
  Workspace,
} from '../../types';

export interface AdminHQOverviewNavigateOptions {
  stageFilter?: string;
  overdueOnly?: boolean;
  tab?: 'overview' | 'tasks' | 'deliverables' | 'notes' | 'revisions' | 'activity';
}

export type AdminHQOverviewTarget =
  | 'clients-accounts'
  | 'workspaces'
  | 'services-packages'
  | 'production-studio'
  | 'projects'
  | 'deliverables-reviews'
  | 'creative-requests'
  | 'design-library'
  | 'invoices-payments'
  | 'proposals'
  | 'business-documents'
  | 'admin-management'
  | 'security-access'
  | 'audit-history'
  | 'platform-settings';

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
  onNavigate: (
    target: AdminHQOverviewTarget,
    projectId?: string,
    options?: AdminHQOverviewNavigateOptions
  ) => void;
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

    const todayIso = new Date().toISOString().slice(0, 10);
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

    const stageCounts: Record<ProductionStage, number> = {
      'New Request': projects.filter(p => (p.stage || 'New Request') === 'New Request').length,
      'Brief Approved': projects.filter(p => p.stage === 'Brief Approved').length,
      'In Production': projects.filter(p => p.stage === 'In Production').length,
      'Internal QA': projects.filter(p => p.stage === 'Internal QA').length,
      'Client Review': projects.filter(p => p.stage === 'Client Review').length,
      'Revision Required': projects.filter(p => p.stage === 'Revision Required').length,
      'Ready for Delivery': projects.filter(p => p.stage === 'Ready for Delivery').length,
      'Delivered': projects.filter(p => p.stage === 'Delivered').length,
    };

    const overdueProjects = projects.filter(
      p =>
        p.expectedDeliveryDate &&
        p.expectedDeliveryDate < todayIso &&
        p.stage !== 'Delivered'
    );

    const itemsAwaitingQA = deliverables.filter(d => !d.isClientPublished);

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
      deliveredProjectsCount: projects.filter(p => p.stage === 'Delivered').length,
      pendingRequests,
      openEnquiries,
      deliverablesAwaitingReview,
      pendingRevisions,
      stageCounts,
      overdueProjects,
      itemsAwaitingQA,
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
  const hasPermissionDeniedError = errorEntries.some(([, msg]) =>
    msg.toLowerCase().includes('missing or insufficient permissions') ||
    msg.toLowerCase().includes('permission-denied')
  );
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
        <div role="alert" className="border border-red-900/50 bg-red-950/20 p-4 text-xs text-red-200 space-y-1.5">
          {errorEntries.map(([source, message]) => (
            <p key={source}>
              <span className="font-mono uppercase text-red-400">{source}:</span> {message}
            </p>
          ))}
          {hasPermissionDeniedError && (
            <p className="pt-2 mt-2 border-t border-red-900/40 text-red-300/90 leading-relaxed">
              Your local <code className="font-mono text-white">/admins/{firebaseUser.uid}</code> session passed verification, but Firestore rejected admin collection queries. Ensure the updated <code className="font-mono text-white">firestore.rules</code> file is deployed to this Firebase project and named database, and verify your <code className="font-mono text-white">/admins/{firebaseUser.uid}</code> record has <code className="font-mono text-white">role: &quot;PlatformAdmin&quot;</code> and active status.
            </p>
          )}
        </div>
      )}

      {/* Quick Operational Actions Bar */}
      <section aria-label="Quick operations actions" className="border border-[#1E1E1E] bg-[#0C0C0C] p-3.5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono uppercase tracking-widest text-[#FF1E1E] font-bold">OPERATIONS CENTER</span>
          <span className="text-neutral-600 hidden sm:inline">·</span>
          <span className="text-xs text-neutral-400 hidden sm:inline">Creative Production Direct Controls</span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => onNavigate('projects', undefined, { tab: 'overview' })}
            className="inline-flex items-center gap-1.5 border border-[#333] bg-[#141414] hover:border-[#FF1E1E] px-3 py-1.5 text-xs font-semibold text-white transition-colors"
          >
            <Plus size={13} className="text-[#FF1E1E]" />
            <span>Create / Browse Projects</span>
          </button>
          <button
            type="button"
            onClick={() => onNavigate('creative-requests')}
            className="inline-flex items-center gap-1.5 border border-[#333] bg-[#141414] hover:border-amber-500 px-3 py-1.5 text-xs font-semibold text-white transition-colors"
          >
            <Inbox size={13} className="text-amber-400" />
            <span>Review Requests ({metrics.pendingRequests.length + metrics.openEnquiries.length})</span>
          </button>
          <button
            type="button"
            onClick={() => onNavigate('design-library')}
            className="inline-flex items-center gap-1.5 border border-[#333] bg-[#141414] hover:border-white px-3 py-1.5 text-xs font-semibold text-white transition-colors"
          >
            <Sparkles size={13} className="text-[#FF1E1E]" />
            <span>Open Creative Engine</span>
          </button>
          <button
            type="button"
            onClick={() => onNavigate('workspaces')}
            className="inline-flex items-center gap-1.5 border border-[#333] bg-[#141414] hover:border-white px-3 py-1.5 text-xs text-neutral-300 hover:text-white transition-colors"
          >
            <Building2 size={13} />
            <span>Workspaces ({metrics.totalWorkspaces})</span>
          </button>
        </div>
      </section>

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

      {/* Active Projects by Production Stage (9-Stage Lifecycle Pipeline) */}
      <section aria-label="Active projects by stage" className="border border-[#1E1E1E] bg-[#0C0C0C] p-4 sm:p-5 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-xs font-mono uppercase tracking-wider text-neutral-300 flex items-center gap-2">
              <FolderKanban size={14} className="text-[#FF1E1E]" />
              <span>Production Lifecycle Pipeline · Stage Breakdown</span>
            </h2>
            <p className="text-[11px] text-neutral-500 mt-0.5">
              Click any stage to filter active projects and inspect deliverables.
            </p>
          </div>
          <span className="text-xs font-mono tabular-nums text-neutral-400">
            {metrics.activeProjectsCount} active · {metrics.deliveredProjectsCount} completed
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2 pt-1">
          {(
            [
              ['New Request', 'New Request', metrics.stageCounts['New Request'], 'border-neutral-800 bg-[#121212] text-neutral-300'],
              ['Brief Approved', 'Brief Approved', metrics.stageCounts['Brief Approved'], 'border-blue-900/50 bg-blue-950/20 text-blue-300'],
              ['In Production', 'In Production', metrics.stageCounts['In Production'], 'border-indigo-900/50 bg-indigo-950/20 text-indigo-300'],
              ['Internal QA', 'Internal QA', metrics.stageCounts['Internal QA'], 'border-amber-900/50 bg-amber-950/20 text-amber-300'],
              ['Client Review', 'Client Review', metrics.stageCounts['Client Review'], 'border-amber-800/60 bg-amber-950/30 text-amber-200'],
              ['Revision Required', 'Revision Req.', metrics.stageCounts['Revision Required'], 'border-red-900/60 bg-red-950/30 text-red-300'],
              ['Ready for Delivery', 'Ready Delivery', metrics.stageCounts['Ready for Delivery'], 'border-cyan-900/50 bg-cyan-950/20 text-cyan-300'],
              ['Delivered', 'Delivered / Done', metrics.stageCounts['Delivered'], 'border-emerald-800/60 bg-emerald-950/30 text-emerald-200'],
            ] as const
          ).map(([stageValue, stageLabel, count, colorClasses]) => (
            <button
              key={stageValue}
              type="button"
              onClick={() => onNavigate('projects', undefined, { stageFilter: stageValue })}
              className={`border p-2.5 text-left rounded transition-all hover:border-[#FF1E1E] group ${colorClasses}`}
            >
              <div className="text-[10px] font-mono uppercase tracking-wider text-neutral-400 group-hover:text-white truncate">
                {stageLabel}
              </div>
              <div className="mt-1 text-lg font-bold font-mono tabular-nums text-white">
                {loadingStates.projects ? '—' : count}
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* Overdue Milestones Alert */}
      {metrics.overdueProjects.length > 0 && (
        <section aria-label="Overdue milestones" className="border border-amber-900/60 bg-amber-950/15 p-4 rounded space-y-2">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-amber-300 font-semibold text-xs">
              <AlertTriangle size={15} />
              <span>Overdue Production Milestones ({metrics.overdueProjects.length})</span>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('projects', undefined, { overdueOnly: true })}
              className="text-xs text-amber-400 hover:text-white underline font-mono"
            >
              Filter Overdue Projects →
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {metrics.overdueProjects.slice(0, 3).map(p => (
              <button
                key={p.id}
                type="button"
                onClick={() => onNavigate('projects', p.id)}
                className="text-left bg-[#101010] border border-[#2B2B2B] hover:border-amber-500 p-2.5 rounded transition-colors"
              >
                <p className="text-xs font-semibold text-white truncate">{p.title}</p>
                <p className="text-[11px] text-amber-300 font-mono mt-0.5">
                  Due {p.expectedDeliveryDate} · Stage: {p.stage}
                </p>
              </button>
            ))}
          </div>
        </section>
      )}

      {/* Operational Queues */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 1. Pending Creative Requests & Public Enquiries */}
        <div className="bg-[#0C0C0C] border border-[#1E1E1E]">
          <div className="px-5 py-4 border-b border-[#1E1E1E] flex items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <span>Requests & Enquiries</span>
                {(metrics.pendingRequests.length + metrics.openEnquiries.length > 0) && (
                  <span className="text-[11px] font-mono text-amber-400 bg-amber-950/40 border border-amber-900/50 px-1.5 py-0.5 rounded">
                    {metrics.pendingRequests.length + metrics.openEnquiries.length}
                  </span>
                )}
              </h2>
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

        {/* 2. Items Awaiting Internal QA */}
        <div className="bg-[#0C0C0C] border border-[#1E1E1E]">
          <div className="px-5 py-4 border-b border-[#1E1E1E] flex items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <span>Internal QA Queue</span>
                {metrics.itemsAwaitingQA.length > 0 && (
                  <span className="text-[11px] font-mono text-amber-400 bg-amber-950/40 border border-amber-900/50 px-1.5 py-0.5 rounded">
                    {metrics.itemsAwaitingQA.length}
                  </span>
                )}
              </h2>
              <p className="text-xs text-neutral-400 mt-0.5">
                Internal draft deliverables requiring QA sign-off before client release.
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('projects', undefined, { stageFilter: 'Internal QA' })}
              className="text-xs font-medium text-amber-400 hover:text-amber-300 inline-flex items-center gap-1 shrink-0"
            >
              <span>View Projects</span>
              <ArrowRight size={13} />
            </button>
          </div>

          <div className="divide-y divide-[#171717]">
            {loadingStates.deliverables ? (
              <div className="p-5 space-y-2.5">
                <div className="h-9 bg-[#141414]" />
                <div className="h-9 bg-[#141414]" />
              </div>
            ) : metrics.itemsAwaitingQA.length === 0 ? (
              <div className="p-6 text-xs text-neutral-500">
                No internal draft deliverables currently awaiting QA review.
              </div>
            ) : (
              metrics.itemsAwaitingQA.slice(0, 4).map(deliverable => {
                const project = projects.find(p => p.id === deliverable.projectId);
                return (
                  <button
                    key={deliverable.id}
                    type="button"
                    onClick={() => onNavigate('projects', deliverable.projectId, { tab: 'deliverables' })}
                    className="w-full px-5 py-3 text-left hover:bg-[#121212] transition-colors flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-white truncate">{deliverable.title}</p>
                      <p className="text-[11px] text-neutral-400 mt-0.5 truncate">
                        {project?.title || 'Project'} · v{deliverable.currentVersion || 1} · {deliverable.fileName}
                      </p>
                    </div>
                    <span className="text-[11px] font-mono text-amber-400 border border-amber-900/50 bg-amber-950/20 px-2 py-0.5 shrink-0">
                      QA Draft
                    </span>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* 3. Deliverables & Revisions Queue (Awaiting Client Review) */}
        <div className="bg-[#0C0C0C] border border-[#1E1E1E]">
          <div className="px-5 py-4 border-b border-[#1E1E1E] flex items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <span>Client Review Queue</span>
                {(metrics.deliverablesAwaitingReview.length + metrics.pendingRevisions.length > 0) && (
                  <span className="text-[11px] font-mono text-emerald-400 bg-emerald-950/40 border border-emerald-900/50 px-1.5 py-0.5 rounded">
                    {metrics.deliverablesAwaitingReview.length + metrics.pendingRevisions.length}
                  </span>
                )}
              </h2>
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
