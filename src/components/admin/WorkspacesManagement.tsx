import React, { useEffect, useMemo, useState } from 'react';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import {
  AlertCircle,
  ArrowUpRight,
  Building2,
  CheckCircle2,
  Clock,
  FolderKanban,
  History,
  Info,
  Package,
  Plus,
  Search,
  ShieldAlert,
  UserCheck,
  Users,
  X,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { db, functions } from '../../lib/firebase';
import {
  ClientProfile,
  ClientProject,
  ServicePackage,
  Workspace,
  WorkspaceMembership,
  WorkspaceStatus,
} from '../../types';
import { Modal } from '../common/Modal';

interface Props {
  initialSelectedWorkspaceId?: string;
  onSelectedWorkspaceChange?: (workspaceId: string | null) => void;
  onOpenClient?: (clientUid: string, workspaceId: string) => void;
  onViewWorkspaceProjects?: (workspaceId: string) => void;
  onOpenServicePackage?: (packageId: string) => void;
}

interface WorkspaceAuditEntry {
  id: string;
  action: string;
  actorUid: string;
  actorName: string;
  details: string;
  createdAt: string;
}

const WORKSPACE_STATUS_OPTIONS: WorkspaceStatus[] = ['Active', 'Onboarding', 'Paused', 'Archived'];

function formatDate(value?: string | null): string {
  if (!value) return '—';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return '—';
  return parsed.toLocaleDateString();
}

function formatDateTime(value?: string | null): string {
  if (!value) return '—';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return '—';
  return parsed.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function toTimestampMs(value?: string): number {
  if (!value) return 0;
  const ms = Date.parse(value);
  return Number.isNaN(ms) ? 0 : ms;
}

function normalizeWorkspaceStatus(status?: string): WorkspaceStatus {
  if (status === 'Onboarding' || status === 'Paused' || status === 'Archived') {
    return status;
  }
  return 'Active';
}

function formatAuditDetails(raw: unknown): string {
  if (!raw) return '—';
  if (typeof raw === 'string') return raw;
  if (typeof raw === 'object') {
    try {
      return (
        Object.entries(raw as Record<string, unknown>)
          .filter(([, val]) => val !== undefined && val !== '')
          .map(([k, v]) => `${k}: ${typeof v === 'object' ? JSON.stringify(v) : String(v)}`)
          .join(' · ') || '—'
      );
    } catch {
      return '—';
    }
  }
  return String(raw);
}

function workspaceExperienceGroup(ws: Workspace): 'Artist' | 'Brand' | 'Other' {
  if (ws.type === 'Artist' || ws.clientCategory === 'artist') return 'Artist';
  if (ws.type === 'Brand' || ws.clientCategory === 'brand') return 'Brand';
  return 'Other';
}

function statusBadgeClasses(status: WorkspaceStatus): string {
  switch (status) {
    case 'Active':
      return 'border-emerald-800/50 bg-emerald-950/30 text-emerald-300';
    case 'Onboarding':
      return 'border-amber-800/50 bg-amber-950/30 text-amber-300';
    case 'Paused':
      return 'border-neutral-700 bg-neutral-900 text-neutral-300';
    case 'Archived':
      return 'border-red-900/50 bg-red-950/30 text-red-300';
  }
}

export const WorkspacesManagement: React.FC<Props> = ({
  initialSelectedWorkspaceId = '',
  onSelectedWorkspaceChange,
  onOpenClient,
  onViewWorkspaceProjects,
  onOpenServicePackage,
}) => {
  const { firebaseUser, canAccessAdminCenter } = useApp();

  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [clients, setClients] = useState<ClientProfile[]>([]);
  const [services, setServices] = useState<ServicePackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [secondaryNotice, setSecondaryNotice] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('All');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [ownerFilter, setOwnerFilter] = useState<string>('All');

  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<string | null>(
    initialSelectedWorkspaceId || null
  );

  // Scoped per-workspace detail state (always cleared on selection change)
  const [memberships, setMemberships] = useState<WorkspaceMembership[]>([]);
  const [membershipsLoading, setMembershipsLoading] = useState(false);
  const [membershipsError, setMembershipsError] = useState<string | null>(null);

  const [relatedProjects, setRelatedProjects] = useState<ClientProject[]>([]);
  const [projectsLoading, setProjectsLoading] = useState(false);
  const [projectsError, setProjectsError] = useState<string | null>(null);

  const [auditLogs, setAuditLogs] = useState<WorkspaceAuditEntry[]>([]);
  const [auditLoading, setAuditLoading] = useState(false);
  const [auditError, setAuditError] = useState<string | null>(null);

  // Feedback banners
  const [actionSuccess, setActionSuccess] = useState('');
  const [actionError, setActionError] = useState('');

  // Status update confirmation modal
  const [pendingStatusChange, setPendingStatusChange] = useState<{
    workspaceId: string;
    workspaceName: string;
    currentStatus: WorkspaceStatus;
    nextStatus: WorkspaceStatus;
  } | null>(null);
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [statusModalError, setStatusModalError] = useState('');

  // Contracted packages management modal
  const [packagesModalOpen, setPackagesModalOpen] = useState(false);
  const [draftPackageIds, setDraftPackageIds] = useState<string[]>([]);
  const [packagesSaving, setPackagesSaving] = useState(false);
  const [packagesModalError, setPackagesModalError] = useState('');

  // Provision / link client workspace modal (adminCreateClientWorkspace)
  const [provisionModalOpen, setProvisionModalOpen] = useState(false);
  const [provisionEmail, setProvisionEmail] = useState('');
  const [provisionName, setProvisionName] = useState('');
  const [provisionType, setProvisionType] = useState<'Artist' | 'Brand'>('Artist');
  const [provisionTagline, setProvisionTagline] = useState('');
  const [provisionDescription, setProvisionDescription] = useState('');
  const [provisionAccentColor, setProvisionAccentColor] = useState('#D97706');
  const [provisionPackageId, setProvisionPackageId] = useState('');
  const [provisionSaving, setProvisionSaving] = useState(false);
  const [provisionError, setProvisionError] = useState('');

  // Sync external selection prop when navigating from Clients & Accounts
  useEffect(() => {
    if (initialSelectedWorkspaceId) {
      setSelectedWorkspaceId(initialSelectedWorkspaceId);
    }
  }, [initialSelectedWorkspaceId]);

  const selectWorkspace = (id: string | null) => {
    setSelectedWorkspaceId(id);
    onSelectedWorkspaceChange?.(id);
  };

  // Top-level directory listeners (active admin only)
  useEffect(() => {
    if (!firebaseUser || !canAccessAdminCenter) {
      setWorkspaces([]);
      setClients([]);
      setServices([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    setSecondaryNotice(null);

    const unsubWorkspaces = onSnapshot(
      collection(db, 'workspaces'),
      snap => {
        const list = snap.docs
          .map(d => ({ id: d.id, ...(d.data() as Omit<Workspace, 'id'>) }))
          .sort(
            (a, b) =>
              toTimestampMs(b.updatedAt || b.createdAt) -
              toTimestampMs(a.updatedAt || a.createdAt)
          );
        setWorkspaces(list);
        setLoading(false);
        setError(null);
      },
      err => {
        setError(err?.message || 'Failed to load workspaces.');
        setLoading(false);
      }
    );

    const unsubClients = onSnapshot(
      collection(db, 'clientProfiles'),
      snap => {
        const list = snap.docs.map(d => {
          const data = d.data() as Record<string, any>;
          return {
            ...data,
            uid: data.uid || d.id,
            displayName: data.displayName || '',
            email: data.email || '',
            organizationName: data.organizationName || '',
            accountType: data.accountType || 'Artist',
            onboardingComplete: Boolean(data.onboardingComplete),
            status: data.status === 'Suspended' ? 'Suspended' : 'Active',
            createdAt: data.createdAt || '',
            updatedAt: data.updatedAt || '',
          } as ClientProfile;
        });
        setClients(list);
      },
      err => {
        setSecondaryNotice(err?.message || 'Client profile details unavailable.');
      }
    );

    const unsubServices = onSnapshot(
      collection(db, 'services'),
      snap => {
        setServices(
          snap.docs.map(d => ({ id: d.id, ...(d.data() as Omit<ServicePackage, 'id'>) }))
        );
      },
      err => {
        setSecondaryNotice(prev => prev || err?.message || 'Service catalog details unavailable.');
      }
    );

    return () => {
      unsubWorkspaces();
      unsubClients();
      unsubServices();
    };
  }, [firebaseUser, canAccessAdminCenter]);

  // Scoped detail listeners for the selected workspace — reset immediately on switch
  useEffect(() => {
    setMemberships([]);
    setMembershipsError(null);
    setRelatedProjects([]);
    setProjectsError(null);
    setAuditLogs([]);
    setAuditError(null);

    if (!firebaseUser || !canAccessAdminCenter || !selectedWorkspaceId) {
      setMembershipsLoading(false);
      setProjectsLoading(false);
      setAuditLoading(false);
      return;
    }

    setMembershipsLoading(true);
    setProjectsLoading(true);
    setAuditLoading(true);

    const unsubMemberships = onSnapshot(
      collection(db, 'workspaces', selectedWorkspaceId, 'memberships'),
      snap => {
        const list = snap.docs.map(d => ({
          id: d.id,
          ...(d.data() as Omit<WorkspaceMembership, 'id'>),
        }));
        setMemberships(list);
        setMembershipsLoading(false);
        setMembershipsError(null);
      },
      err => {
        setMembershipsError(err?.message || 'Unable to load workspace memberships.');
        setMembershipsLoading(false);
      }
    );

    const unsubProjects = onSnapshot(
      query(collection(db, 'clientProjects'), where('workspaceId', '==', selectedWorkspaceId)),
      snap => {
        const list = snap.docs
          .map(d => ({ id: d.id, ...(d.data() as Omit<ClientProject, 'id'>) }))
          .sort(
            (a, b) =>
              toTimestampMs(b.updatedAt || b.createdAt) -
              toTimestampMs(a.updatedAt || a.createdAt)
          );
        setRelatedProjects(list);
        setProjectsLoading(false);
        setProjectsError(null);
      },
      err => {
        setProjectsError(err?.message || 'Unable to load workspace projects.');
        setProjectsLoading(false);
      }
    );

    const unsubAudit = onSnapshot(
      query(collection(db, 'adminAuditLogs'), where('target', '==', selectedWorkspaceId)),
      snap => {
        const entries = snap.docs
          .map(d => {
            const data = d.data() as Record<string, any>;
            return {
              id: d.id,
              action: data.action || 'admin_action',
              actorUid: data.actorUid || '',
              actorName: data.actorName || data.actorUid || 'Administrator',
              details: formatAuditDetails(data.details),
              createdAt: data.createdAt || '',
            } as WorkspaceAuditEntry;
          })
          .sort((a, b) => toTimestampMs(b.createdAt) - toTimestampMs(a.createdAt))
          .slice(0, 20);
        setAuditLogs(entries);
        setAuditLoading(false);
        setAuditError(null);
      },
      err => {
        setAuditError(err?.message || 'Unable to load workspace audit logs.');
        setAuditLoading(false);
      }
    );

    return () => {
      unsubMemberships();
      unsubProjects();
      unsubAudit();
    };
  }, [firebaseUser, canAccessAdminCenter, selectedWorkspaceId]);

  // Escape closes detail panel only when no modal is open
  useEffect(() => {
    if (!selectedWorkspaceId || pendingStatusChange || packagesModalOpen || provisionModalOpen) {
      return;
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') selectWorkspace(null);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [selectedWorkspaceId, pendingStatusChange, packagesModalOpen, provisionModalOpen]);

  const clientsByUid = useMemo(() => {
    const map = new Map<string, ClientProfile>();
    clients.forEach(c => map.set(c.uid, c));
    return map;
  }, [clients]);

  const servicesById = useMemo(() => {
    const map = new Map<string, ServicePackage>();
    services.forEach(s => map.set(s.id, s));
    return map;
  }, [services]);

  const selectedWorkspace = useMemo(
    () =>
      selectedWorkspaceId ? workspaces.find(w => w.id === selectedWorkspaceId) || null : null,
    [workspaces, selectedWorkspaceId]
  );

  const selectedOwnerProfile = useMemo(
    () => (selectedWorkspace?.ownerId ? clientsByUid.get(selectedWorkspace.ownerId) || null : null),
    [selectedWorkspace, clientsByUid]
  );

  const selectedContractedPackages = useMemo(() => {
    if (!selectedWorkspace?.contractedPackageIds?.length) return [];
    return selectedWorkspace.contractedPackageIds.map(id => ({
      id,
      pkg: servicesById.get(id) || null,
    }));
  }, [selectedWorkspace, servicesById]);

  // Distinct workspace owners for filter dropdown
  const ownerFilterOptions = useMemo(() => {
    const uniqueOwnerIds = Array.from(
      new Set(workspaces.map(w => w.ownerId).filter(Boolean))
    );
    return uniqueOwnerIds
      .map(uid => {
        const profile = clientsByUid.get(uid);
        return {
          uid,
          label: profile
            ? `${profile.displayName || profile.organizationName} (${profile.email || uid})`
            : uid,
        };
      })
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [workspaces, clientsByUid]);

  // Eligible onboarded active clients without a linked workspace (for quick provisioning selection)
  const provisionableClients = useMemo(() => {
    const ownedUids = new Set(workspaces.map(w => w.ownerId).filter(Boolean));
    return clients
      .filter(
        c =>
          c.onboardingComplete &&
          c.status !== 'Suspended' &&
          !c.workspaceId &&
          !ownedUids.has(c.uid)
      )
      .sort((a, b) => a.displayName.localeCompare(b.displayName));
  }, [clients, workspaces]);

  const stats = useMemo(() => {
    const total = workspaces.length;
    const active = workspaces.filter(w => normalizeWorkspaceStatus(w.status) === 'Active').length;
    const onboarding = workspaces.filter(
      w => normalizeWorkspaceStatus(w.status) === 'Onboarding'
    ).length;
    const pausedOrArchived = workspaces.filter(w => {
      const s = normalizeWorkspaceStatus(w.status);
      return s === 'Paused' || s === 'Archived';
    }).length;
    return { total, active, onboarding, pausedOrArchived };
  }, [workspaces]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return workspaces.filter(ws => {
      const owner = ws.ownerId ? clientsByUid.get(ws.ownerId) : undefined;
      const matchesSearch =
        !q ||
        ws.name.toLowerCase().includes(q) ||
        ws.id.toLowerCase().includes(q) ||
        (ws.ownerId || '').toLowerCase().includes(q) ||
        (ws.contactEmail || '').toLowerCase().includes(q) ||
        (owner?.displayName || '').toLowerCase().includes(q) ||
        (owner?.email || '').toLowerCase().includes(q) ||
        (owner?.organizationName || '').toLowerCase().includes(q);

      const expGroup = workspaceExperienceGroup(ws);
      const matchesType =
        typeFilter === 'All' ||
        (typeFilter === 'Artist' && expGroup === 'Artist') ||
        (typeFilter === 'Brand' && expGroup === 'Brand') ||
        (typeFilter === 'Other' && expGroup === 'Other');

      const wsStatus = normalizeWorkspaceStatus(ws.status);
      const matchesStatus = statusFilter === 'All' || wsStatus === statusFilter;

      const matchesOwner = ownerFilter === 'All' || ws.ownerId === ownerFilter;

      return matchesSearch && matchesType && matchesStatus && matchesOwner;
    });
  }, [workspaces, clientsByUid, search, typeFilter, statusFilter, ownerFilter]);

  const hasActiveFilters =
    Boolean(search.trim()) ||
    typeFilter !== 'All' ||
    statusFilter !== 'All' ||
    ownerFilter !== 'All';

  const clearFilters = () => {
    setSearch('');
    setTypeFilter('All');
    setStatusFilter('All');
    setOwnerFilter('All');
  };

  // Compute live member count ONLY when memberships subcollection is loaded for selected workspace
  const selectedMemberCount = useMemo(() => {
    if (!selectedWorkspace) return 0;
    const memberIds = new Set<string>();
    if (selectedWorkspace.ownerId) memberIds.add(selectedWorkspace.ownerId);
    memberships.forEach(m => {
      if (m.userId) memberIds.add(m.userId);
      else if (m.id) memberIds.add(m.id);
    });
    return memberIds.size;
  }, [selectedWorkspace, memberships]);

  const requestStatusChange = (ws: Workspace, nextStatus: WorkspaceStatus) => {
    const currentStatus = normalizeWorkspaceStatus(ws.status);
    if (currentStatus === nextStatus) return;
    setStatusModalError('');
    setActionError('');
    setActionSuccess('');
    setPendingStatusChange({
      workspaceId: ws.id,
      workspaceName: ws.name,
      currentStatus,
      nextStatus,
    });
  };

  const confirmStatusChange = async () => {
    if (!pendingStatusChange) return;
    setStatusUpdating(true);
    setStatusModalError('');
    setActionError('');
    setActionSuccess('');
    try {
      await httpsCallable(functions, 'adminUpdateWorkspace')({
        workspaceId: pendingStatusChange.workspaceId,
        status: pendingStatusChange.nextStatus,
      });
      setActionSuccess(
        `Updated workspace "${pendingStatusChange.workspaceName}" status to ${pendingStatusChange.nextStatus}.`
      );
      setPendingStatusChange(null);
    } catch (err: any) {
      setStatusModalError(err?.message || 'Unable to update workspace status.');
    } finally {
      setStatusUpdating(false);
    }
  };

  const openPackagesModal = (ws: Workspace) => {
    setDraftPackageIds(ws.contractedPackageIds ? [...ws.contractedPackageIds] : []);
    setPackagesModalError('');
    setActionError('');
    setActionSuccess('');
    setPackagesModalOpen(true);
  };

  const toggleDraftPackage = (packageId: string) => {
    setDraftPackageIds(prev =>
      prev.includes(packageId) ? prev.filter(id => id !== packageId) : [...prev, packageId]
    );
  };

  const saveContractedPackages = async () => {
    if (!selectedWorkspace) return;
    setPackagesSaving(true);
    setPackagesModalError('');
    setActionError('');
    setActionSuccess('');
    try {
      await httpsCallable(functions, 'adminUpdateWorkspace')({
        workspaceId: selectedWorkspace.id,
        contractedPackageIds: draftPackageIds,
      });
      setActionSuccess(
        `Updated contracted service packages for "${selectedWorkspace.name}" (${draftPackageIds.length} assigned).`
      );
      setPackagesModalOpen(false);
    } catch (err: any) {
      setPackagesModalError(err?.message || 'Unable to update contracted service packages.');
    } finally {
      setPackagesSaving(false);
    }
  };

  const openProvisionModal = () => {
    setProvisionEmail('');
    setProvisionName('');
    setProvisionType('Artist');
    setProvisionTagline('');
    setProvisionDescription('');
    setProvisionAccentColor('#D97706');
    setProvisionPackageId('');
    setProvisionError('');
    setActionError('');
    setActionSuccess('');
    setProvisionModalOpen(true);
  };

  const handleSelectProvisionClient = (uid: string) => {
    const client = clientsByUid.get(uid);
    if (!client) return;
    setProvisionEmail(client.email);
    setProvisionName(client.organizationName || client.displayName || '');
    const nextType: 'Artist' | 'Brand' = client.accountType === 'Artist' ? 'Artist' : 'Brand';
    setProvisionType(nextType);
    setProvisionAccentColor(nextType === 'Artist' ? '#D97706' : '#2563EB');
  };

  const submitProvisionWorkspace = async (event: React.FormEvent) => {
    event.preventDefault();
    const email = provisionEmail.trim().toLowerCase();
    const name = provisionName.trim();
    if (!email || !name) {
      setProvisionError('Client email and workspace name are required.');
      return;
    }

    setProvisionSaving(true);
    setProvisionError('');
    setActionError('');
    setActionSuccess('');

    try {
      const result = await httpsCallable(functions, 'adminCreateClientWorkspace')({
        email,
        name,
        workspaceType: provisionType,
        accentColor: provisionAccentColor,
        description: provisionDescription.trim(),
        tagline: provisionTagline.trim(),
        packageId: provisionPackageId,
      });
      const payload = result.data as { workspaceId?: string; alreadyExists?: boolean };
      setProvisionModalOpen(false);
      if (payload.workspaceId) {
        selectWorkspace(payload.workspaceId);
      }
      setActionSuccess(
        payload.alreadyExists
          ? `Client already owns workspace (${payload.workspaceId}); linked existing workspace without creating a duplicate.`
          : `Provisioned workspace "${name}" (${payload.workspaceId || 'created'}).`
      );
    } catch (err: any) {
      setProvisionError(err?.message || 'Unable to provision client workspace.');
    } finally {
      setProvisionSaving(false);
    }
  };

  if (!firebaseUser || !canAccessAdminCenter) {
    return (
      <div className="border border-red-900/40 bg-[#0C0C0C] p-6 text-sm text-red-300 flex items-center gap-3">
        <ShieldAlert size={18} className="text-[#FF1E1E] shrink-0" />
        <span>Active platform administrator authentication is required to manage workspaces.</span>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="border border-[#1A1A1A] bg-[#0C0C0C] py-16 text-center text-sm text-neutral-400">
        Loading client workspaces…
      </div>
    );
  }

  if (error) {
    return (
      <div
        role="alert"
        className="border border-red-900/40 bg-red-950/20 p-5 text-sm text-red-300 flex items-center gap-3"
      >
        <AlertCircle size={18} className="shrink-0" />
        <span>{error}</span>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Summary Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="border border-[#1A1A1A] bg-[#0C0C0C] px-4 py-3">
          <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-widest text-neutral-500">
            <span>Total Workspaces</span>
            <Building2 size={13} className="text-neutral-500" />
          </div>
          <p className="mt-1.5 text-2xl font-black text-white tabular-nums">{stats.total}</p>
        </div>
        <div className="border border-[#1A1A1A] bg-[#0C0C0C] px-4 py-3">
          <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-widest text-neutral-500">
            <span>Active</span>
            <UserCheck size={13} className="text-emerald-400" />
          </div>
          <p className="mt-1.5 text-2xl font-black text-white tabular-nums">{stats.active}</p>
        </div>
        <div className="border border-[#1A1A1A] bg-[#0C0C0C] px-4 py-3">
          <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-widest text-neutral-500">
            <span>Onboarding</span>
            <Clock size={13} className="text-amber-400" />
          </div>
          <p className="mt-1.5 text-2xl font-black text-white tabular-nums">{stats.onboarding}</p>
        </div>
        <div className="border border-[#1A1A1A] bg-[#0C0C0C] px-4 py-3">
          <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-widest text-neutral-500">
            <span>Paused / Archived</span>
            <AlertCircle size={13} className="text-neutral-400" />
          </div>
          <p className="mt-1.5 text-2xl font-black text-white tabular-nums">
            {stats.pausedOrArchived}
          </p>
        </div>
      </div>

      {/* Feedback Banners */}
      {actionSuccess && (
        <div
          role="status"
          className="flex items-center justify-between gap-3 border border-emerald-800/40 bg-emerald-950/20 px-4 py-3 text-xs text-emerald-200"
        >
          <span className="flex items-center gap-2">
            <CheckCircle2 size={15} className="text-emerald-400 shrink-0" />
            <span>{actionSuccess}</span>
          </span>
          <button
            type="button"
            onClick={() => setActionSuccess('')}
            className="text-emerald-300 hover:text-white"
            aria-label="Dismiss notification"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {actionError && (
        <div
          role="alert"
          className="flex items-center justify-between gap-3 border border-red-500/30 bg-red-950/20 px-4 py-3 text-xs text-red-300"
        >
          <span className="flex items-center gap-2">
            <AlertCircle size={15} className="text-red-400 shrink-0" />
            <span>{actionError}</span>
          </span>
          <button
            type="button"
            onClick={() => setActionError('')}
            className="text-red-300 hover:text-white"
            aria-label="Dismiss error"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {secondaryNotice && (
        <p className="border border-[#262626] bg-[#0C0C0C] px-3 py-2 text-xs text-neutral-400">
          {secondaryNotice}
        </p>
      )}

      {/* Search, Filters & Provision Trigger */}
      <div className="border border-[#1A1A1A] bg-[#0C0C0C] p-3.5 space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-2.5 items-center">
          <div className="relative md:col-span-4">
            <Search
              size={14}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500"
            />
            <input
              type="search"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search name, workspace ID, or owner…"
              aria-label="Search workspaces"
              className="w-full bg-[#121212] border border-[#242424] text-white pl-9 pr-3 py-2 text-xs placeholder-neutral-500 focus:border-[#FF1E1E] focus:outline-none"
            />
          </div>

          <div className="md:col-span-2">
            <select
              aria-label="Filter by workspace experience"
              value={typeFilter}
              onChange={e => setTypeFilter(e.target.value)}
              className="w-full bg-[#121212] border border-[#242424] text-white px-3 py-2 text-xs focus:border-[#FF1E1E] focus:outline-none"
            >
              <option value="All">All Experiences</option>
              <option value="Artist">Artist</option>
              <option value="Brand">Brand</option>
              <option value="Other">Business / Other</option>
            </select>
          </div>

          <div className="md:col-span-2">
            <select
              aria-label="Filter by workspace status"
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="w-full bg-[#121212] border border-[#242424] text-white px-3 py-2 text-xs focus:border-[#FF1E1E] focus:outline-none"
            >
              <option value="All">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Onboarding">Onboarding</option>
              <option value="Paused">Paused</option>
              <option value="Archived">Archived</option>
            </select>
          </div>

          <div className="md:col-span-2">
            <select
              aria-label="Filter by workspace owner"
              value={ownerFilter}
              onChange={e => setOwnerFilter(e.target.value)}
              className="w-full bg-[#121212] border border-[#242424] text-white px-3 py-2 text-xs focus:border-[#FF1E1E] focus:outline-none"
            >
              <option value="All">All Owners</option>
              {ownerFilterOptions.map(opt => (
                <option key={opt.uid} value={opt.uid}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-2 flex items-center justify-end gap-2">
            {hasActiveFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="border border-[#2A2A2A] bg-[#141414] px-2.5 py-2 text-xs text-neutral-300 hover:text-white hover:border-[#444]"
              >
                Clear
              </button>
            )}
            <button
              type="button"
              onClick={openProvisionModal}
              className="inline-flex items-center gap-1.5 bg-[#FF1E1E] hover:bg-[#E01919] px-3 py-2 text-xs font-semibold text-white shrink-0"
            >
              <Plus size={13} />
              <span>Provision</span>
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono text-neutral-500">
          <span className="tabular-nums">
            Showing {filtered.length} of {workspaces.length} workspace
            {workspaces.length === 1 ? '' : 's'}
          </span>
          {selectedWorkspace && (
            <span className="text-neutral-400 truncate max-w-[280px]">
              Inspecting: {selectedWorkspace.name} ({selectedWorkspace.id})
            </span>
          )}
        </div>
      </div>

      {workspaces.length === 0 ? (
        <div className="border border-[#1A1A1A] bg-[#0C0C0C] py-16 text-center space-y-2">
          <Building2 size={22} className="mx-auto text-neutral-500" />
          <p className="text-sm font-semibold text-white">No workspaces stored yet</p>
          <p className="text-xs text-neutral-500">
            Client workspaces created during registration or provisioned by an administrator will appear here.
          </p>
        </div>
      ) : (
        <div
          className={`grid gap-5 items-start ${
            selectedWorkspace
              ? 'xl:grid-cols-[minmax(0,1.45fr)_minmax(380px,1fr)]'
              : 'grid-cols-1'
          }`}
        >
          {/* Workspace Directory Table */}
          <div className="border border-[#1A1A1A] bg-[#0C0C0C] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="bg-[#080808] text-neutral-500 font-mono text-[10px] uppercase tracking-widest border-b border-[#1A1A1A]">
                  <tr>
                    <th className="text-left px-4 py-3">Workspace</th>
                    <th className="text-left px-3 py-3">Experience</th>
                    <th className="text-left px-3 py-3">Owner / Client</th>
                    <th className="text-left px-3 py-3">Status</th>
                    <th className="text-left px-3 py-3">Members</th>
                    <th className="text-left px-3 py-3">Created</th>
                    <th className="text-left px-3 py-3">Updated</th>
                    <th className="text-right px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#161616]">
                  {filtered.map(ws => {
                    const status = normalizeWorkspaceStatus(ws.status);
                    const ownerProfile = ws.ownerId ? clientsByUid.get(ws.ownerId) : undefined;
                    const isSelected = selectedWorkspaceId === ws.id;
                    const isMaster = ws.id === 'ws-lyrical-ent';

                    return (
                      <tr
                        key={ws.id}
                        onClick={() => selectWorkspace(ws.id)}
                        className={`cursor-pointer transition-colors ${
                          isSelected ? 'bg-[#171010]' : 'hover:bg-[#121212]'
                        }`}
                      >
                        <td className="px-4 py-3 min-w-[190px]">
                          <div className="flex items-center gap-2 min-w-0">
                            <span
                              className="h-2.5 w-2.5 shrink-0 border border-white/15"
                              style={{ backgroundColor: ws.brand?.accentColor || '#333333' }}
                              aria-hidden="true"
                            />
                            <span className="font-semibold text-white truncate max-w-[190px]">
                              {ws.name}
                            </span>
                            {isMaster && (
                              <span className="font-mono text-[9px] uppercase px-1.5 py-0.5 border border-red-800/50 bg-red-950/40 text-[#FF1E1E] shrink-0">
                                Master
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] font-mono text-neutral-500 truncate max-w-[220px] mt-0.5">
                            {ws.id}
                          </div>
                        </td>

                        <td className="px-3 py-3 whitespace-nowrap text-neutral-300">
                          {ws.type}
                        </td>

                        <td className="px-3 py-3 min-w-[160px] max-w-[210px]">
                          {ownerProfile ? (
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5 min-w-0">
                                <span className="text-neutral-200 truncate">
                                  {ownerProfile.displayName || ownerProfile.organizationName}
                                </span>
                                {ownerProfile.status === 'Suspended' && (
                                  <span className="font-mono text-[9px] uppercase px-1 py-0.5 border border-red-800/50 bg-red-950/30 text-red-300 shrink-0">
                                    Suspended
                                  </span>
                                )}
                              </div>
                              <span className="block text-[10px] font-mono text-neutral-500 truncate">
                                {ownerProfile.email || ownerProfile.uid}
                              </span>
                            </div>
                          ) : (
                            <div className="min-w-0">
                              <span className="block font-mono text-[11px] text-neutral-400 truncate">
                                {ws.ownerId || '—'}
                              </span>
                              {ws.contactEmail && (
                                <span className="block text-[10px] font-mono text-neutral-500 truncate">
                                  {ws.contactEmail}
                                </span>
                              )}
                            </div>
                          )}
                        </td>

                        <td className="px-3 py-3 whitespace-nowrap">
                          <span
                            className={`inline-block font-mono text-[10px] uppercase px-2 py-0.5 border ${statusBadgeClasses(
                              status
                            )}`}
                          >
                            {status}
                          </span>
                        </td>

                        <td className="px-3 py-3 font-mono text-[11px] text-neutral-400 whitespace-nowrap tabular-nums">
                          {isSelected && !membershipsLoading
                            ? `${selectedMemberCount} total`
                            : ws.ownerId
                              ? 'Owner (inspect)'
                              : '—'}
                        </td>

                        <td className="px-3 py-3 font-mono text-[11px] text-neutral-500 tabular-nums whitespace-nowrap">
                          {formatDate(ws.createdAt)}
                        </td>

                        <td className="px-3 py-3 font-mono text-[11px] text-neutral-500 tabular-nums whitespace-nowrap">
                          {formatDate(ws.updatedAt)}
                        </td>

                        <td className="px-4 py-3 text-right whitespace-nowrap">
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={e => {
                                e.stopPropagation();
                                selectWorkspace(ws.id);
                              }}
                              className="border border-[#262626] bg-[#121212] px-2 py-1 text-[11px] text-neutral-300 hover:text-white hover:border-[#444]"
                            >
                              Details
                            </button>
                            {onViewWorkspaceProjects && (
                              <button
                                type="button"
                                onClick={e => {
                                  e.stopPropagation();
                                  onViewWorkspaceProjects(ws.id);
                                }}
                                title="View workspace projects"
                                className="border border-[#262626] bg-[#121212] px-2 py-1 text-[11px] text-neutral-300 hover:text-white hover:border-[#FF1E1E]"
                              >
                                Projects
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {filtered.length === 0 && (
                    <tr>
                      <td colSpan={8} className="px-4 py-10 text-center text-neutral-500">
                        No workspaces match your current search or filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Workspace Detail Panel */}
          {selectedWorkspace && (
            <aside
              aria-label="Workspace details"
              className="border border-[#242424] bg-[#0C0C0C] divide-y divide-[#1A1A1A]"
            >
              {/* Header & Navigation */}
              <div className="p-5 space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className="h-11 w-11 border border-[#2A2A2A] flex items-center justify-center font-mono text-sm font-bold text-white shrink-0"
                      style={{
                        backgroundColor: selectedWorkspace.brand?.accentColor || '#1F1F1F',
                      }}
                    >
                      {selectedWorkspace.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-base font-bold text-white truncate">
                        {selectedWorkspace.name}
                      </h3>
                      <p className="text-[11px] font-mono text-neutral-400 truncate">
                        {selectedWorkspace.id}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => selectWorkspace(null)}
                    className="p-1.5 text-neutral-400 hover:text-white border border-transparent hover:border-[#2A2A2A]"
                    aria-label="Close workspace details"
                  >
                    <X size={16} />
                  </button>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`font-mono text-[10px] uppercase px-2 py-0.5 border ${statusBadgeClasses(
                      normalizeWorkspaceStatus(selectedWorkspace.status)
                    )}`}
                  >
                    Status: {normalizeWorkspaceStatus(selectedWorkspace.status)}
                  </span>
                  <span className="font-mono text-[10px] uppercase px-2 py-0.5 border border-[#262626] bg-[#121212] text-neutral-300">
                    Experience: {selectedWorkspace.type}
                  </span>
                  {selectedWorkspace.clientCategory && (
                    <span className="font-mono text-[10px] uppercase px-2 py-0.5 border border-[#262626] bg-[#121212] text-neutral-400">
                      Category: {selectedWorkspace.clientCategory}
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap gap-2 pt-1">
                  {onViewWorkspaceProjects && (
                    <button
                      type="button"
                      onClick={() => onViewWorkspaceProjects(selectedWorkspace.id)}
                      className="inline-flex items-center gap-1.5 bg-[#FF1E1E] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#E01919]"
                    >
                      <FolderKanban size={12} />
                      <span className="tabular-nums">
                        View Workspace Projects ({relatedProjects.length})
                      </span>
                      <ArrowUpRight size={12} />
                    </button>
                  )}
                  {onOpenClient && selectedWorkspace.ownerId && (
                    <button
                      type="button"
                      onClick={() =>
                        onOpenClient(selectedWorkspace.ownerId, selectedWorkspace.id)
                      }
                      className="inline-flex items-center gap-1.5 border border-[#2E2E2E] bg-[#141414] px-3 py-1.5 text-xs font-medium text-white hover:border-[#4A4A4A]"
                    >
                      <Users size={12} />
                      <span>Inspect Client Profile</span>
                      <ArrowUpRight size={12} />
                    </button>
                  )}
                </div>
              </div>

              {/* Lifecycle Status Control (via adminUpdateWorkspace) */}
              <div className="p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-[10px] font-mono uppercase tracking-widest text-neutral-500">
                    Lifecycle Status Control
                  </h4>
                  <span className="text-[10px] font-mono text-neutral-500">
                    adminUpdateWorkspace
                  </span>
                </div>
                <div className="grid grid-cols-4 gap-1.5">
                  {WORKSPACE_STATUS_OPTIONS.map(option => {
                    const current = normalizeWorkspaceStatus(selectedWorkspace.status);
                    const isCurrent = current === option;
                    return (
                      <button
                        key={option}
                        type="button"
                        disabled={isCurrent || statusUpdating}
                        onClick={() => requestStatusChange(selectedWorkspace, option)}
                        className={`px-2 py-1.5 font-mono text-[11px] border transition-colors ${
                          isCurrent
                            ? 'border-[#FF1E1E] bg-[#FF1E1E]/15 text-white font-semibold'
                            : 'border-[#262626] bg-[#121212] text-neutral-400 hover:text-white hover:border-[#444]'
                        } disabled:cursor-default`}
                      >
                        {option}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Owner & Associated Client Profile */}
              <div className="p-5 space-y-2.5">
                <h4 className="text-[10px] font-mono uppercase tracking-widest text-neutral-500">
                  Owner &amp; Associated Client
                </h4>
                {selectedOwnerProfile ? (
                  <div className="border border-[#1E1E1E] bg-[#101010] p-3 text-xs space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-semibold text-white truncate">
                          {selectedOwnerProfile.displayName || 'Unnamed Client'}
                        </p>
                        <p className="text-[11px] font-mono text-neutral-400 truncate">
                          {selectedOwnerProfile.email}
                        </p>
                      </div>
                      <span
                        className={`font-mono text-[10px] uppercase px-2 py-0.5 border shrink-0 ${
                          selectedOwnerProfile.status === 'Suspended'
                            ? 'border-red-800/50 bg-red-950/30 text-red-300'
                            : 'border-emerald-800/50 bg-emerald-950/30 text-emerald-300'
                        }`}
                      >
                        {selectedOwnerProfile.status === 'Suspended' ? 'Suspended' : 'Active'}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-[11px] text-neutral-400 pt-1 border-t border-[#1D1D1D]">
                      <span>Type: {selectedOwnerProfile.accountType}</span>
                      <span>
                        Onboarding:{' '}
                        {selectedOwnerProfile.onboardingComplete ? 'Complete' : 'Incomplete'}
                      </span>
                      <span className="col-span-2 truncate">
                        Org: {selectedOwnerProfile.organizationName || '—'}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="border border-[#1E1E1E] bg-[#101010] p-3 text-xs text-neutral-400 space-y-1">
                    <p>Owner UID: <span className="font-mono text-neutral-200">{selectedWorkspace.ownerId || '—'}</span></p>
                    <p className="text-[11px] text-neutral-500">
                      No matching client profile document found in clientProfiles.
                    </p>
                  </div>
                )}
              </div>

              {/* Ownership & Memberships Roster */}
              <div className="p-5 space-y-2.5">
                <div className="flex items-center justify-between">
                  <h4 className="text-[10px] font-mono uppercase tracking-widest text-neutral-500 flex items-center gap-1.5">
                    <Users size={12} />
                    <span className="tabular-nums">
                      Ownership &amp; Members ({membershipsLoading ? '…' : selectedMemberCount})
                    </span>
                  </h4>
                </div>

                {membershipsLoading ? (
                  <p className="text-xs text-neutral-500">Loading workspace memberships…</p>
                ) : membershipsError ? (
                  <p className="text-xs text-red-300">{membershipsError}</p>
                ) : (
                  <ul className="space-y-1.5 text-xs">
                    {selectedWorkspace.ownerId && (
                      <li className="border border-[#1E1E1E] bg-[#101010] px-3 py-2 flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <span className="block font-semibold text-white truncate">
                            {selectedOwnerProfile?.displayName ||
                              selectedOwnerProfile?.email ||
                              selectedWorkspace.ownerId}
                          </span>
                          <span className="block font-mono text-[10px] text-neutral-500 truncate">
                            UID: {selectedWorkspace.ownerId}
                          </span>
                        </div>
                        <span className="font-mono text-[10px] uppercase px-2 py-0.5 border border-[#2D2D2D] bg-[#161616] text-neutral-200 shrink-0">
                          Owner
                        </span>
                      </li>
                    )}

                    {memberships
                      .filter(m => m.userId !== selectedWorkspace.ownerId)
                      .map(member => {
                        const memberProfile = member.userId
                          ? clientsByUid.get(member.userId)
                          : undefined;
                        return (
                          <li
                            key={member.id}
                            className="border border-[#1E1E1E] bg-[#101010] px-3 py-2 flex items-center justify-between gap-2"
                          >
                            <div className="min-w-0">
                              <span className="block text-neutral-200 truncate">
                                {memberProfile?.displayName ||
                                  memberProfile?.email ||
                                  member.userId ||
                                  member.id}
                              </span>
                              <span className="block font-mono text-[10px] text-neutral-500">
                                Status: {member.status} · Joined {formatDate(member.joinedAt)}
                              </span>
                            </div>
                            <span className="font-mono text-[10px] uppercase px-2 py-0.5 border border-[#262626] bg-[#141414] text-neutral-300 shrink-0">
                              {member.role}
                            </span>
                          </li>
                        );
                      })}

                    {memberships.filter(m => m.userId !== selectedWorkspace.ownerId).length === 0 && (
                      <li className="text-[11px] text-neutral-500 pt-0.5">
                        No additional team membership records in this workspace.
                      </li>
                    )}
                  </ul>
                )}
              </div>

              {/* Workspace Metadata & Timestamps */}
              <div className="p-5 space-y-3">
                <h4 className="text-[10px] font-mono uppercase tracking-widest text-neutral-500">
                  Workspace Metadata &amp; Timestamps
                </h4>
                <dl className="grid grid-cols-2 gap-x-4 gap-y-2.5 text-xs">
                  <div className="col-span-2">
                    <dt className="text-[10px] font-mono uppercase text-neutral-500">
                      Description
                    </dt>
                    <dd className="mt-0.5 text-neutral-300 break-words">
                      {selectedWorkspace.description || '—'}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[10px] font-mono uppercase text-neutral-500">
                      Contact Email
                    </dt>
                    <dd className="mt-0.5 font-mono text-[11px] text-neutral-300 break-all">
                      {selectedWorkspace.contactEmail || '—'}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[10px] font-mono uppercase text-neutral-500">
                      Brand Tagline
                    </dt>
                    <dd className="mt-0.5 text-neutral-300 break-words">
                      {selectedWorkspace.brand?.tagline || '—'}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[10px] font-mono uppercase text-neutral-500">Created</dt>
                    <dd className="mt-0.5 font-mono text-[11px] text-neutral-300 tabular-nums">
                      {formatDateTime(selectedWorkspace.createdAt)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[10px] font-mono uppercase text-neutral-500">
                      Last Updated
                    </dt>
                    <dd className="mt-0.5 font-mono text-[11px] text-neutral-300 tabular-nums">
                      {formatDateTime(selectedWorkspace.updatedAt)}
                    </dd>
                  </div>
                  {selectedWorkspace.artistProfile?.genre && (
                    <div>
                      <dt className="text-[10px] font-mono uppercase text-neutral-500">Genre</dt>
                      <dd className="mt-0.5 text-neutral-300">
                        {selectedWorkspace.artistProfile.genre}
                      </dd>
                    </div>
                  )}
                  {selectedWorkspace.brandProfile?.industry && (
                    <div>
                      <dt className="text-[10px] font-mono uppercase text-neutral-500">
                        Industry
                      </dt>
                      <dd className="mt-0.5 text-neutral-300">
                        {selectedWorkspace.brandProfile.industry}
                      </dd>
                    </div>
                  )}
                  {(selectedWorkspace.artistProfile?.website ||
                    selectedWorkspace.brandProfile?.website) && (
                    <div className="col-span-2">
                      <dt className="text-[10px] font-mono uppercase text-neutral-500">Website</dt>
                      <dd className="mt-0.5 font-mono text-[11px] text-neutral-300 break-all">
                        {selectedWorkspace.artistProfile?.website ||
                          selectedWorkspace.brandProfile?.website}
                      </dd>
                    </div>
                  )}
                </dl>

                {/* Honest Backend Capability Scope Notice */}
                <div className="border border-[#242424] bg-[#101010] p-3 text-[11px] text-neutral-400 flex items-start gap-2">
                  <Info size={14} className="text-neutral-500 shrink-0 mt-0.5" />
                  <span>
                    <strong className="text-neutral-300 font-medium">Backend scope:</strong>{' '}
                    <code className="font-mono text-neutral-300">adminUpdateWorkspace</code> governs
                    lifecycle status and contracted service packages. Direct edits to workspace
                    name/metadata, ownership transfer, membership changes, and workspace deletion are
                    unavailable here. To update the client organization name, inspect the owner
                    profile in Clients &amp; Accounts.
                  </span>
                </div>
              </div>

              {/* Contracted Service Packages */}
              <div className="p-5 space-y-2.5">
                <div className="flex items-center justify-between">
                  <h4 className="text-[10px] font-mono uppercase tracking-widest text-neutral-500 flex items-center gap-1.5">
                    <Package size={12} />
                    <span className="tabular-nums">
                      Contracted Services ({selectedContractedPackages.length})
                    </span>
                  </h4>
                  <button
                    type="button"
                    onClick={() => openPackagesModal(selectedWorkspace)}
                    className="text-[11px] text-[#FF1E1E] hover:underline"
                  >
                    Manage Services
                  </button>
                </div>

                {selectedContractedPackages.length === 0 ? (
                  <p className="text-xs text-neutral-500">
                    No service packages currently assigned to this workspace.
                  </p>
                ) : (
                  <ul className="space-y-1.5">
                    {selectedContractedPackages.map(({ id, pkg }) => (
                      <li
                        key={id}
                        className="border border-[#1E1E1E] bg-[#101010] px-3 py-2 text-xs flex items-center justify-between gap-2"
                      >
                        <div className="min-w-0">
                          <span className="block font-semibold text-white truncate">
                            {pkg ? pkg.name : id}
                          </span>
                          <span className="block text-[10px] font-mono text-neutral-500">
                            {pkg
                              ? `${pkg.category} · ${pkg.tier}${!pkg.isActive ? ' · Inactive' : ''}`
                              : 'Service record not found'}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {pkg && (
                            <span className="font-mono text-[11px] text-neutral-300 tabular-nums">
                              ${pkg.priceUsd.toLocaleString()}
                            </span>
                          )}
                          {pkg && onOpenServicePackage && (
                            <button
                              type="button"
                              onClick={() => onOpenServicePackage(pkg.id)}
                              className="inline-flex items-center gap-1 text-[11px] text-[#FF1E1E] hover:underline"
                            >
                              <span>Open</span>
                              <ArrowUpRight size={11} />
                            </button>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Related Production Projects */}
              <div className="p-5 space-y-2.5">
                <div className="flex items-center justify-between">
                  <h4 className="text-[10px] font-mono uppercase tracking-widest text-neutral-500 flex items-center gap-1.5">
                    <FolderKanban size={12} />
                    <span className="tabular-nums">
                      Related Projects ({relatedProjects.length})
                    </span>
                  </h4>
                  {onViewWorkspaceProjects && relatedProjects.length > 0 && (
                    <button
                      type="button"
                      onClick={() => onViewWorkspaceProjects(selectedWorkspace.id)}
                      className="text-[11px] text-[#FF1E1E] hover:underline"
                    >
                      Open in Projects
                    </button>
                  )}
                </div>

                {projectsLoading ? (
                  <p className="text-xs text-neutral-500">Loading workspace projects…</p>
                ) : projectsError ? (
                  <p className="text-xs text-red-300">{projectsError}</p>
                ) : relatedProjects.length === 0 ? (
                  <p className="text-xs text-neutral-500">
                    No production projects linked to this workspace ID yet.
                  </p>
                ) : (
                  <ul className="space-y-2 max-h-52 overflow-y-auto pr-1">
                    {relatedProjects.map(project => (
                      <li
                        key={project.id}
                        className="border border-[#1E1E1E] bg-[#101010] px-3 py-2 text-xs space-y-1"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-semibold text-white truncate">{project.title}</span>
                          <span className="font-mono text-[10px] text-neutral-300 shrink-0">
                            {project.stage || project.status}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-[11px] font-mono text-neutral-500 tabular-nums">
                          <span>Progress: {project.progress || 0}%</span>
                          <span>Due: {project.expectedDeliveryDate || '—'}</span>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Workspace Audit History */}
              <div className="p-5 space-y-2.5">
                <h4 className="text-[10px] font-mono uppercase tracking-widest text-neutral-500 flex items-center gap-1.5">
                  <History size={12} />
                  <span>Workspace Audit History</span>
                </h4>

                {auditLoading ? (
                  <p className="text-xs text-neutral-500">Loading audit history…</p>
                ) : auditError ? (
                  <p className="text-xs text-red-300">{auditError}</p>
                ) : auditLogs.length === 0 ? (
                  <p className="text-xs text-neutral-500">
                    No workspace audit events recorded yet.
                  </p>
                ) : (
                  <ul className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {auditLogs.map(entry => (
                      <li
                        key={entry.id}
                        className="border-l-2 border-[#2E2E2E] bg-[#101010] px-3 py-2 text-xs space-y-1"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-mono text-[11px] font-semibold text-white">
                            {entry.action}
                          </span>
                          <span className="font-mono text-[10px] text-neutral-500 tabular-nums shrink-0">
                            {formatDateTime(entry.createdAt)}
                          </span>
                        </div>
                        <p className="text-[11px] text-neutral-400 break-words">{entry.details}</p>
                        <p className="text-[10px] font-mono text-neutral-500">
                          Actor: {entry.actorName}
                        </p>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </aside>
          )}
        </div>
      )}

      {/* Confirm Workspace Lifecycle Status Transition */}
      <Modal
        isOpen={Boolean(pendingStatusChange)}
        onClose={() => {
          if (!statusUpdating) {
            setPendingStatusChange(null);
            setStatusModalError('');
          }
        }}
        maxWidth="md"
        title="Confirm Workspace Status Change"
        subtitle={pendingStatusChange?.workspaceName}
      >
        {pendingStatusChange && (
          <div className="space-y-4">
            {statusModalError && (
              <p
                role="alert"
                className="rounded border border-red-500/30 bg-red-950/20 p-3 text-xs text-red-300"
              >
                {statusModalError}
              </p>
            )}
            <p className="text-sm text-neutral-300 leading-relaxed">
              Change workspace status from{' '}
              <strong className="text-white">{pendingStatusChange.currentStatus}</strong> to{' '}
              <strong className="text-white">{pendingStatusChange.nextStatus}</strong>?
            </p>
            {(pendingStatusChange.nextStatus === 'Paused' ||
              pendingStatusChange.nextStatus === 'Archived') && (
              <p className="rounded border border-amber-800/40 bg-amber-950/20 p-3 text-xs text-amber-200 leading-relaxed">
                Note: Pausing or archiving a workspace restricts active client reads and project
                access enforced by Firestore security rules until restored to Active or Onboarding.
              </p>
            )}
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                disabled={statusUpdating}
                onClick={() => {
                  setPendingStatusChange(null);
                  setStatusModalError('');
                }}
                className="rounded border border-[#333] px-4 py-2 text-xs text-neutral-300 hover:text-white disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={statusUpdating}
                onClick={() => void confirmStatusChange()}
                className="rounded bg-[#FF1E1E] px-4 py-2 text-xs font-semibold text-white disabled:opacity-50"
              >
                {statusUpdating ? 'Updating…' : `Set Status: ${pendingStatusChange.nextStatus}`}
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Manage Contracted Service Packages Modal */}
      <Modal
        isOpen={packagesModalOpen && Boolean(selectedWorkspace)}
        onClose={() => {
          if (!packagesSaving) {
            setPackagesModalOpen(false);
            setPackagesModalError('');
          }
        }}
        maxWidth="lg"
        title="Manage Contracted Services"
        subtitle={selectedWorkspace?.name}
      >
        {selectedWorkspace && (
          <div className="space-y-4">
            {packagesModalError && (
              <p
                role="alert"
                className="rounded border border-red-500/30 bg-red-950/20 p-3 text-xs text-red-300"
              >
                {packagesModalError}
              </p>
            )}
            <p className="text-xs text-neutral-400">
              Select the service packages contracted to this workspace. Saved via{' '}
              <code className="font-mono text-neutral-300">adminUpdateWorkspace</code>.
            </p>
            {services.length === 0 ? (
              <p className="text-xs text-neutral-500 py-4 text-center">
                No service packages found in the catalog.
              </p>
            ) : (
              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {services.map(pkg => {
                  const checked = draftPackageIds.includes(pkg.id);
                  const alreadyAssigned = (
                    selectedWorkspace.contractedPackageIds || []
                  ).includes(pkg.id);
                  const unavailableForNewAssignment = !pkg.isActive && !alreadyAssigned;

                  return (
                    <label
                      key={pkg.id}
                      className={`flex items-center justify-between gap-3 border p-3 text-xs transition-colors ${
                        unavailableForNewAssignment
                          ? 'border-[#1E1E1E] bg-[#0E0E0E] opacity-60 cursor-not-allowed'
                          : checked
                            ? 'border-[#FF1E1E]/60 bg-[#171010] cursor-pointer'
                            : 'border-[#242424] bg-[#121212] hover:border-[#3A3A3A] cursor-pointer'
                      }`}
                    >
                      <span className="flex items-start gap-2.5 min-w-0">
                        <input
                          type="checkbox"
                          checked={checked}
                          disabled={unavailableForNewAssignment}
                          onChange={() => {
                            if (!unavailableForNewAssignment) {
                              toggleDraftPackage(pkg.id);
                            }
                          }}
                          className="mt-0.5 accent-[#FF1E1E] disabled:opacity-50"
                        />
                        <span className="min-w-0">
                          <span className="block font-semibold text-white truncate">
                            {pkg.name}
                          </span>
                          <span className="block text-[10px] font-mono text-neutral-400">
                            {pkg.category} · {pkg.tier}
                            {unavailableForNewAssignment
                              ? ' · Inactive (unavailable for new assignment)'
                              : !pkg.isActive
                                ? ' · Inactive (existing assignment)'
                                : ''}
                          </span>
                        </span>
                      </span>
                      <span className="font-mono text-neutral-300 tabular-nums shrink-0">
                        ${pkg.priceUsd.toLocaleString()}
                      </span>
                    </label>
                  );
                })}
              </div>
            )}
            <div className="flex items-center justify-between pt-2 border-t border-[#1F1F1F]">
              <span className="text-[11px] font-mono text-neutral-500 tabular-nums">
                {draftPackageIds.length} package{draftPackageIds.length === 1 ? '' : 's'} selected
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={packagesSaving}
                  onClick={() => {
                    setPackagesModalOpen(false);
                    setPackagesModalError('');
                  }}
                  className="rounded border border-[#333] px-4 py-2 text-xs text-neutral-300 hover:text-white disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={packagesSaving}
                  onClick={() => void saveContractedPackages()}
                  className="rounded bg-[#FF1E1E] px-4 py-2 text-xs font-semibold text-white disabled:opacity-50"
                >
                  {packagesSaving ? 'Saving…' : 'Save Service Assignments'}
                </button>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Provision / Link Client Workspace Modal (adminCreateClientWorkspace) */}
      <Modal
        isOpen={provisionModalOpen}
        onClose={() => {
          if (!provisionSaving) {
            setProvisionModalOpen(false);
            setProvisionError('');
          }
        }}
        maxWidth="lg"
        title="Provision or Link Client Workspace"
        subtitle="Unified Artist / Brand workspace via adminCreateClientWorkspace"
      >
        <form onSubmit={e => void submitProvisionWorkspace(e)} className="space-y-4">
          {provisionError && (
            <p
              role="alert"
              className="rounded border border-red-500/30 bg-red-950/20 p-3 text-xs text-red-300"
            >
              {provisionError}
            </p>
          )}
          <p className="text-xs text-neutral-400 leading-relaxed">
            Provisions a workspace for an active client who has completed onboarding. If the client
            already owns a workspace, the existing record is preserved and linked without creating a
            duplicate.
          </p>

          {provisionableClients.length > 0 && (
            <div>
              <label
                htmlFor="provision-quick-client"
                className="mb-1 block text-[10px] font-mono uppercase text-neutral-500"
              >
                Clients without a workspace ({provisionableClients.length})
              </label>
              <select
                id="provision-quick-client"
                defaultValue=""
                onChange={e => handleSelectProvisionClient(e.target.value)}
                className="w-full rounded border border-[#333] bg-[#141414] px-3 py-2 text-xs text-white focus:border-[#FF1E1E] focus:outline-none"
              >
                <option value="">Select an unlinked client to autofill…</option>
                {provisionableClients.map(c => (
                  <option key={c.uid} value={c.uid}>
                    {c.displayName || c.organizationName} ({c.email}) · {c.accountType}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="provision-client-email"
                className="mb-1 block text-[10px] font-mono uppercase text-neutral-500"
              >
                Client Email *
              </label>
              <input
                id="provision-client-email"
                type="email"
                required
                value={provisionEmail}
                onChange={e => setProvisionEmail(e.target.value)}
                placeholder="client@domain.com"
                className="w-full rounded border border-[#333] bg-[#141414] px-3 py-2 text-xs text-white focus:border-[#FF1E1E] focus:outline-none"
              />
            </div>
            <div>
              <label
                htmlFor="provision-workspace-name"
                className="mb-1 block text-[10px] font-mono uppercase text-neutral-500"
              >
                Workspace Name *
              </label>
              <input
                id="provision-workspace-name"
                required
                maxLength={100}
                value={provisionName}
                onChange={e => setProvisionName(e.target.value)}
                placeholder="Organization or Artist name"
                className="w-full rounded border border-[#333] bg-[#141414] px-3 py-2 text-xs text-white focus:border-[#FF1E1E] focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label
                htmlFor="provision-workspace-type"
                className="mb-1 block text-[10px] font-mono uppercase text-neutral-500"
              >
                Experience Type
              </label>
              <select
                id="provision-workspace-type"
                value={provisionType}
                onChange={e => {
                  const next = e.target.value === 'Brand' ? 'Brand' : 'Artist';
                  setProvisionType(next);
                  setProvisionAccentColor(next === 'Artist' ? '#D97706' : '#2563EB');
                }}
                className="w-full rounded border border-[#333] bg-[#141414] px-3 py-2 text-xs text-white focus:border-[#FF1E1E] focus:outline-none"
              >
                <option value="Artist">Artist</option>
                <option value="Brand">Brand</option>
              </select>
            </div>
            <div>
              <label
                htmlFor="provision-accent-color"
                className="mb-1 block text-[10px] font-mono uppercase text-neutral-500"
              >
                Accent Color
              </label>
              <input
                id="provision-accent-color"
                type="color"
                value={provisionAccentColor}
                onChange={e => setProvisionAccentColor(e.target.value)}
                className="h-[34px] w-full rounded border border-[#333] bg-[#141414] px-1 py-0.5"
              />
            </div>
            <div>
              <label
                htmlFor="provision-initial-package"
                className="mb-1 block text-[10px] font-mono uppercase text-neutral-500"
              >
                Initial Package (Optional)
              </label>
              <select
                id="provision-initial-package"
                value={provisionPackageId}
                onChange={e => setProvisionPackageId(e.target.value)}
                className="w-full rounded border border-[#333] bg-[#141414] px-3 py-2 text-xs text-white focus:border-[#FF1E1E] focus:outline-none"
              >
                <option value="">None</option>
                {services
                  .filter(s => s.isActive)
                  .map(s => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
              </select>
            </div>
          </div>

          <div>
            <label
              htmlFor="provision-tagline"
              className="mb-1 block text-[10px] font-mono uppercase text-neutral-500"
            >
              Tagline (Optional)
            </label>
            <input
              id="provision-tagline"
              maxLength={160}
              value={provisionTagline}
              onChange={e => setProvisionTagline(e.target.value)}
              placeholder="Short creative tagline"
              className="w-full rounded border border-[#333] bg-[#141414] px-3 py-2 text-xs text-white focus:border-[#FF1E1E] focus:outline-none"
            />
          </div>

          <div>
            <label
              htmlFor="provision-description"
              className="mb-1 block text-[10px] font-mono uppercase text-neutral-500"
            >
              Description (Optional)
            </label>
            <textarea
              id="provision-description"
              rows={2}
              maxLength={1000}
              value={provisionDescription}
              onChange={e => setProvisionDescription(e.target.value)}
              placeholder="Workspace scope or creative overview"
              className="w-full rounded border border-[#333] bg-[#141414] px-3 py-2 text-xs text-white focus:border-[#FF1E1E] focus:outline-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              disabled={provisionSaving}
              onClick={() => {
                setProvisionModalOpen(false);
                setProvisionError('');
              }}
              className="rounded border border-[#333] px-4 py-2 text-xs text-neutral-300 hover:text-white disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={provisionSaving}
              className="rounded bg-[#FF1E1E] px-4 py-2 text-xs font-semibold text-white disabled:opacity-50"
            >
              {provisionSaving ? 'Provisioning…' : 'Provision Workspace'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default WorkspacesManagement;
