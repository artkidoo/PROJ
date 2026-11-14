import React, { useEffect, useMemo, useState } from 'react';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import {
  AlertCircle,
  ArrowUpRight,
  Building2,
  CheckCircle2,
  Clock,
  Edit3,
  FolderKanban,
  History,
  Power,
  Search,
  ShieldAlert,
  UserCheck,
  Users,
  X,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { db, functions } from '../../lib/firebase';
import { ClientProfile, ClientProject, Workspace } from '../../types';
import { Modal } from '../common/Modal';

interface Props {
  initialSelectedUid?: string;
  onSelectedClientChange?: (uid: string | null) => void;
  onSelectClient?: (uid: string) => void;
  onViewClientProjects?: (uid: string) => void;
  onOpenWorkspace?: (workspaceId: string, clientUid: string) => void;
}

interface AdminAuditEntry {
  id: string;
  action: string;
  actorUid: string;
  actorName: string;
  targetUid?: string;
  details: string;
  createdAt: string;
}

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

function formatAuditDetails(raw: unknown): string {
  if (!raw) return '—';
  if (typeof raw === 'string') return raw;
  if (typeof raw === 'object') {
    try {
      return Object.entries(raw as Record<string, unknown>)
        .filter(([, val]) => val !== undefined && val !== '')
        .map(([key, val]) => `${key}: ${typeof val === 'object' ? JSON.stringify(val) : String(val)}`)
        .join(' · ') || '—';
    } catch {
      return '—';
    }
  }
  return String(raw);
}

function normalizeStatus(status?: string): 'Active' | 'Suspended' {
  return status === 'Suspended' ? 'Suspended' : 'Active';
}

function toTimestampMs(value?: string): number {
  if (!value) return 0;
  const ms = Date.parse(value);
  return Number.isNaN(ms) ? 0 : ms;
}

export const ClientsDirectory: React.FC<Props> = ({
  initialSelectedUid = '',
  onSelectedClientChange,
  onSelectClient,
  onViewClientProjects,
  onOpenWorkspace,
}) => {
  const { firebaseUser, canAccessAdminCenter } = useApp();
  const navigateToProjects = onViewClientProjects ?? onSelectClient;

  const [clients, setClients] = useState<ClientProfile[]>([]);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [workspaceNotice, setWorkspaceNotice] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [accountTypeFilter, setAccountTypeFilter] = useState<string>('All');
  const [accountStatusFilter, setAccountStatusFilter] = useState<string>('All');
  const [onboardingFilter, setOnboardingFilter] = useState<string>('All');

  const [selectedUid, setSelectedUid] = useState<string | null>(initialSelectedUid || null);

  useEffect(() => {
    if (initialSelectedUid) {
      setSelectedUid(initialSelectedUid);
    }
  }, [initialSelectedUid]);

  const selectClient = (uid: string | null) => {
    setSelectedUid(uid);
    onSelectedClientChange?.(uid);
  };
  const [selectedProjects, setSelectedProjects] = useState<ClientProject[]>([]);
  const [projectsLoading, setProjectsLoading] = useState(false);
  const [projectsError, setProjectsError] = useState<string | null>(null);
  const [selectedAuditLogs, setSelectedAuditLogs] = useState<AdminAuditEntry[]>([]);
  const [auditLoading, setAuditLoading] = useState(false);
  const [auditError, setAuditError] = useState<string | null>(null);

  const [actionSuccess, setActionSuccess] = useState('');
  const [actionError, setActionError] = useState('');

  const [editingClient, setEditingClient] = useState<ClientProfile | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [editForm, setEditForm] = useState<{
    displayName: string;
    organizationName: string;
    accountType: 'Artist' | 'Brand' | 'Company';
  }>({
    displayName: '',
    organizationName: '',
    accountType: 'Artist',
  });
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving'>('idle');
  const [editModalError, setEditModalError] = useState('');

  const [statusConfirmTarget, setStatusConfirmTarget] = useState<{
    uid: string;
    displayName: string;
    email: string;
    nextStatus: 'Active' | 'Suspended';
  } | null>(null);
  const [statusConfirmPending, setStatusConfirmPending] = useState(false);
  const [statusModalError, setStatusModalError] = useState('');

  // Directory-wide live listeners (only when authenticated active admin)
  useEffect(() => {
    if (!firebaseUser || !canAccessAdminCenter) {
      setClients([]);
      setWorkspaces([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    setWorkspaceNotice(null);

    const unsubClients = onSnapshot(
      collection(db, 'clientProfiles'),
      snap => {
        const list = snap.docs
          .map(d => {
            const data = d.data() as Record<string, any>;
            return {
              ...data,
              uid: data.uid || d.id,
              displayName: data.displayName || '',
              email: data.email || '',
              organizationName: data.organizationName || '',
              accountType: data.accountType || 'Artist',
              onboardingComplete: Boolean(data.onboardingComplete),
              status: normalizeStatus(data.status),
              createdAt: data.createdAt || '',
              updatedAt: data.updatedAt || '',
            } as ClientProfile;
          })
          .sort((a, b) => toTimestampMs(b.createdAt) - toTimestampMs(a.createdAt));

        setClients(list);
        setLoading(false);
        setError(null);
      },
      err => {
        setError(err?.message || 'Failed to load client profiles.');
        setLoading(false);
      }
    );

    const unsubWorkspaces = onSnapshot(
      collection(db, 'workspaces'),
      snap => {
        setWorkspaces(snap.docs.map(d => ({ id: d.id, ...(d.data() as Omit<Workspace, 'id'>) })));
        setWorkspaceNotice(null);
      },
      err => {
        setWorkspaceNotice(err?.message || 'Workspace details unavailable.');
      }
    );

    return () => {
      unsubClients();
      unsubWorkspaces();
    };
  }, [firebaseUser, canAccessAdminCenter]);

  // Per-client detail listeners: reset immediately when switching clients to prevent stale state
  useEffect(() => {
    setSelectedProjects([]);
    setProjectsError(null);
    setSelectedAuditLogs([]);
    setAuditError(null);

    if (!firebaseUser || !canAccessAdminCenter || !selectedUid) {
      setProjectsLoading(false);
      setAuditLoading(false);
      return;
    }

    setProjectsLoading(true);
    setAuditLoading(true);

    const unsubProjects = onSnapshot(
      query(collection(db, 'clientProjects'), where('clientUid', '==', selectedUid)),
      snap => {
        const items = snap.docs
          .map(d => ({ id: d.id, ...(d.data() as Omit<ClientProject, 'id'>) }))
          .sort((a, b) => toTimestampMs(b.updatedAt || b.createdAt) - toTimestampMs(a.updatedAt || a.createdAt));
        setSelectedProjects(items);
        setProjectsLoading(false);
        setProjectsError(null);
      },
      err => {
        setProjectsError(err?.message || 'Unable to load client projects.');
        setProjectsLoading(false);
      }
    );

    const unsubAudit = onSnapshot(
      query(collection(db, 'adminAuditLogs'), where('targetUid', '==', selectedUid)),
      snap => {
        const logs = snap.docs
          .map(d => {
            const data = d.data() as Record<string, any>;
            return {
              id: d.id,
              action: data.action || 'admin_action',
              actorUid: data.actorUid || '',
              actorName: data.actorName || data.actorUid || 'Administrator',
              targetUid: data.targetUid,
              details: formatAuditDetails(data.details),
              createdAt: data.createdAt || '',
            } as AdminAuditEntry;
          })
          .sort((a, b) => toTimestampMs(b.createdAt) - toTimestampMs(a.createdAt))
          .slice(0, 20);
        setSelectedAuditLogs(logs);
        setAuditLoading(false);
        setAuditError(null);
      },
      err => {
        setAuditError(err?.message || 'Unable to load account history.');
        setAuditLoading(false);
      }
    );

    return () => {
      unsubProjects();
      unsubAudit();
    };
  }, [firebaseUser, canAccessAdminCenter, selectedUid]);

  // Escape closes detail panel only when modals are closed
  useEffect(() => {
    if (!selectedUid || editOpen || statusConfirmTarget) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') selectClient(null);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [selectedUid, editOpen, statusConfirmTarget]);

  const workspaceMapById = useMemo(() => {
    const map = new Map<string, Workspace>();
    workspaces.forEach(ws => map.set(ws.id, ws));
    return map;
  }, [workspaces]);

  const workspaceMapByOwner = useMemo(() => {
    const map = new Map<string, Workspace>();
    workspaces.forEach(ws => {
      if (ws.ownerId && !map.has(ws.ownerId)) {
        map.set(ws.ownerId, ws);
      }
    });
    return map;
  }, [workspaces]);

  const resolveWorkspace = (client: ClientProfile): Workspace | null => {
    if (client.workspaceId && workspaceMapById.has(client.workspaceId)) {
      return workspaceMapById.get(client.workspaceId) || null;
    }
    return workspaceMapByOwner.get(client.uid) || null;
  };

  const selectedClient = useMemo(
    () => (selectedUid ? clients.find(c => c.uid === selectedUid) || null : null),
    [clients, selectedUid]
  );

  const selectedWorkspace = useMemo(
    () => (selectedClient ? resolveWorkspace(selectedClient) : null),
    [selectedClient, workspaceMapById, workspaceMapByOwner]
  );

  const stats = useMemo(() => {
    const total = clients.length;
    const suspended = clients.filter(c => normalizeStatus(c.status) === 'Suspended').length;
    const active = total - suspended;
    const onboardingIncomplete = clients.filter(c => !c.onboardingComplete).length;
    return { total, active, suspended, onboardingIncomplete };
  }, [clients]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return clients.filter(c => {
      const ws = resolveWorkspace(c);
      const matchesSearch =
        !q ||
        c.displayName.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        c.organizationName.toLowerCase().includes(q) ||
        c.uid.toLowerCase().includes(q) ||
        (ws?.name || '').toLowerCase().includes(q);

      const matchesType = accountTypeFilter === 'All' || c.accountType === accountTypeFilter;
      const clientStatus = normalizeStatus(c.status);
      const matchesAccountStatus =
        accountStatusFilter === 'All' || clientStatus === accountStatusFilter;
      const matchesOnboarding =
        onboardingFilter === 'All' ||
        (onboardingFilter === 'Completed' && c.onboardingComplete) ||
        (onboardingFilter === 'Incomplete' && !c.onboardingComplete);

      return matchesSearch && matchesType && matchesAccountStatus && matchesOnboarding;
    });
  }, [
    clients,
    search,
    accountTypeFilter,
    accountStatusFilter,
    onboardingFilter,
    workspaceMapById,
    workspaceMapByOwner,
  ]);

  const hasActiveFilters =
    Boolean(search.trim()) ||
    accountTypeFilter !== 'All' ||
    accountStatusFilter !== 'All' ||
    onboardingFilter !== 'All';

  const clearFilters = () => {
    setSearch('');
    setAccountTypeFilter('All');
    setAccountStatusFilter('All');
    setOnboardingFilter('All');
  };

  const openEdit = (client: ClientProfile) => {
    setEditingClient(client);
    setEditForm({
      displayName: client.displayName || '',
      organizationName: client.organizationName || '',
      accountType: client.accountType || 'Artist',
    });
    setEditModalError('');
    setActionError('');
    setEditOpen(true);
  };

  const saveClient = async () => {
    if (!editingClient) return;
    const displayName = editForm.displayName.trim();
    const organizationName = editForm.organizationName.trim();
    if (!displayName || !organizationName) {
      setEditModalError('Display name and organization name are required.');
      return;
    }

    setSaveStatus('saving');
    setEditModalError('');
    setActionError('');
    setActionSuccess('');

    const fn = httpsCallable(functions, 'adminUpdateClientProfile');
    try {
      await fn({
        uid: editingClient.uid,
        displayName,
        organizationName,
        accountType: editForm.accountType,
      });
      setActionSuccess(`Updated client profile for ${displayName}.`);
      setEditOpen(false);
      setEditingClient(null);
    } catch (err: any) {
      setEditModalError(err?.message || 'Unable to save client changes.');
    } finally {
      setSaveStatus('idle');
    }
  };

  const requestStatusToggle = (client: ClientProfile) => {
    const currentStatus = normalizeStatus(client.status);
    const nextStatus = currentStatus === 'Active' ? 'Suspended' : 'Active';
    setStatusModalError('');
    setActionError('');
    setActionSuccess('');
    setStatusConfirmTarget({
      uid: client.uid,
      displayName: client.displayName || client.organizationName || 'this client',
      email: client.email,
      nextStatus,
    });
  };

  const confirmToggleClientStatus = async () => {
    if (!statusConfirmTarget) return;
    setStatusConfirmPending(true);
    setStatusModalError('');
    setActionError('');
    setActionSuccess('');

    const fn = httpsCallable(functions, 'adminUpdateClientProfile');
    try {
      await fn({
        uid: statusConfirmTarget.uid,
        status: statusConfirmTarget.nextStatus,
      });
      setActionSuccess(
        statusConfirmTarget.nextStatus === 'Suspended'
          ? `Suspended account for ${statusConfirmTarget.displayName}.`
          : `Reactivated account for ${statusConfirmTarget.displayName}.`
      );
      setStatusConfirmTarget(null);
    } catch (err: any) {
      setStatusModalError(err?.message || 'Unable to update client status.');
    } finally {
      setStatusConfirmPending(false);
    }
  };

  if (!firebaseUser || !canAccessAdminCenter) {
    return (
      <div className="border border-red-900/40 bg-[#0C0C0C] p-6 text-sm text-red-300 flex items-center gap-3">
        <ShieldAlert size={18} className="text-[#FF1E1E] shrink-0" />
        <span>Active platform administrator authentication is required to view and manage clients.</span>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="border border-[#1A1A1A] bg-[#0C0C0C] py-16 text-center text-sm text-neutral-400">
        Loading registered client accounts…
      </div>
    );
  }

  if (error) {
    return (
      <div role="alert" className="border border-red-900/40 bg-red-950/20 p-5 text-sm text-red-300 flex items-center gap-3">
        <AlertCircle size={18} className="shrink-0" />
        <span>{error}</span>
      </div>
    );
  }

  if (clients.length === 0) {
    return (
      <div className="border border-[#1A1A1A] bg-[#0C0C0C] py-16 text-center space-y-2">
        <Users size={22} className="mx-auto text-neutral-500" />
        <p className="text-sm font-semibold text-white">No clients registered yet</p>
        <p className="text-xs text-neutral-500">
          Registered Artist, Brand, and Company accounts will appear here automatically.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Summary Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="border border-[#1A1A1A] bg-[#0C0C0C] px-4 py-3">
          <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-widest text-neutral-500">
            <span>Total Clients</span>
            <Users size={13} className="text-neutral-500" />
          </div>
          <p className="mt-1.5 text-2xl font-black text-white tabular-nums">{stats.total}</p>
        </div>
        <div className="border border-[#1A1A1A] bg-[#0C0C0C] px-4 py-3">
          <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-widest text-neutral-500">
            <span>Active Accounts</span>
            <UserCheck size={13} className="text-emerald-400" />
          </div>
          <p className="mt-1.5 text-2xl font-black text-white tabular-nums">{stats.active}</p>
        </div>
        <div className="border border-[#1A1A1A] bg-[#0C0C0C] px-4 py-3">
          <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-widest text-neutral-500">
            <span>Suspended</span>
            <Power size={13} className="text-red-400" />
          </div>
          <p className="mt-1.5 text-2xl font-black text-white tabular-nums">{stats.suspended}</p>
        </div>
        <div className="border border-[#1A1A1A] bg-[#0C0C0C] px-4 py-3">
          <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-widest text-neutral-500">
            <span>Onboarding Pending</span>
            <Clock size={13} className="text-amber-400" />
          </div>
          <p className="mt-1.5 text-2xl font-black text-white tabular-nums">
            {stats.onboardingIncomplete}
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

      {workspaceNotice && (
        <p className="border border-[#262626] bg-[#0C0C0C] px-3 py-2 text-xs text-neutral-400">
          {workspaceNotice}
        </p>
      )}

      {/* Search & Multi-Facet Filter Bar */}
      <div className="border border-[#1A1A1A] bg-[#0C0C0C] p-3.5 space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-2.5">
          <div className="relative md:col-span-5">
            <Search
              size={14}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500"
            />
            <input
              type="search"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search name, email, organization, or workspace…"
              aria-label="Search clients"
              className="w-full bg-[#121212] border border-[#242424] text-white pl-9 pr-3 py-2 text-xs placeholder-neutral-500 focus:border-[#FF1E1E] focus:outline-none"
            />
          </div>

          <div className="md:col-span-2">
            <select
              aria-label="Filter by account type"
              value={accountTypeFilter}
              onChange={e => setAccountTypeFilter(e.target.value)}
              className="w-full bg-[#121212] border border-[#242424] text-white px-3 py-2 text-xs focus:border-[#FF1E1E] focus:outline-none"
            >
              <option value="All">All Types</option>
              <option value="Artist">Artist</option>
              <option value="Brand">Brand</option>
              <option value="Company">Company</option>
            </select>
          </div>

          <div className="md:col-span-2">
            <select
              aria-label="Filter by account status"
              value={accountStatusFilter}
              onChange={e => setAccountStatusFilter(e.target.value)}
              className="w-full bg-[#121212] border border-[#242424] text-white px-3 py-2 text-xs focus:border-[#FF1E1E] focus:outline-none"
            >
              <option value="All">All Account Statuses</option>
              <option value="Active">Active</option>
              <option value="Suspended">Suspended</option>
            </select>
          </div>

          <div className="md:col-span-3 flex gap-2">
            <select
              aria-label="Filter by onboarding status"
              value={onboardingFilter}
              onChange={e => setOnboardingFilter(e.target.value)}
              className="flex-1 bg-[#121212] border border-[#242424] text-white px-3 py-2 text-xs focus:border-[#FF1E1E] focus:outline-none"
            >
              <option value="All">All Onboarding</option>
              <option value="Completed">Onboarding Completed</option>
              <option value="Incomplete">Onboarding Incomplete</option>
            </select>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="border border-[#2A2A2A] bg-[#141414] px-3 py-2 text-xs text-neutral-300 hover:text-white hover:border-[#444] shrink-0"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between text-[11px] font-mono text-neutral-500">
          <span className="tabular-nums">
            Showing {filtered.length} of {clients.length} client account{clients.length === 1 ? '' : 's'}
          </span>
          {selectedClient && (
            <span className="text-neutral-400 truncate max-w-[260px]">
              Inspecting: {selectedClient.displayName || selectedClient.email}
            </span>
          )}
        </div>
      </div>

      {/* Directory + Live Client Detail Split View */}
      <div
        className={`grid gap-5 items-start ${
          selectedClient ? 'xl:grid-cols-[minmax(0,1.45fr)_minmax(360px,1fr)]' : 'grid-cols-1'
        }`}
      >
        {/* Client Directory Table */}
        <div className="border border-[#1A1A1A] bg-[#0C0C0C] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-[#080808] text-neutral-500 font-mono text-[10px] uppercase tracking-widest border-b border-[#1A1A1A]">
                <tr>
                  <th className="text-left px-4 py-3">Client</th>
                  <th className="text-left px-3 py-3">Type</th>
                  <th className="text-left px-3 py-3">Organization</th>
                  <th className="text-left px-3 py-3">Workspace</th>
                  <th className="text-left px-3 py-3">Account</th>
                  <th className="text-left px-3 py-3">Onboarding</th>
                  <th className="text-left px-3 py-3">Registered</th>
                  <th className="text-right px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#161616]">
                {filtered.map(c => {
                  const status = normalizeStatus(c.status);
                  const ws = resolveWorkspace(c);
                  const isSelected = selectedUid === c.uid;
                  return (
                    <tr
                      key={c.uid}
                      onClick={() => selectClient(c.uid)}
                      className={`cursor-pointer transition-colors ${
                        isSelected ? 'bg-[#171010]' : 'hover:bg-[#121212]'
                      }`}
                    >
                      <td className="px-4 py-3 min-w-[180px]">
                        <div className="font-semibold text-white truncate max-w-[220px]">
                          {c.displayName || 'Unnamed Client'}
                        </div>
                        <div className="text-[11px] font-mono text-neutral-500 truncate max-w-[220px]">
                          {c.email || c.uid}
                        </div>
                      </td>
                      <td className="px-3 py-3 text-neutral-300 whitespace-nowrap">
                        {c.accountType}
                      </td>
                      <td className="px-3 py-3 text-neutral-300 max-w-[160px] truncate">
                        {c.organizationName || '—'}
                      </td>
                      <td className="px-3 py-3 max-w-[160px]">
                        {ws ? (
                          <div className="min-w-0">
                            <span className="block text-neutral-200 truncate">{ws.name}</span>
                            <span className="block text-[10px] font-mono text-neutral-500">
                              {ws.status || 'Active'}
                            </span>
                          </div>
                        ) : (
                          <span className="text-neutral-500">Not linked</span>
                        )}
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap">
                        <span
                          className={`inline-block font-mono text-[10px] uppercase px-2 py-0.5 border ${
                            status === 'Active'
                              ? 'border-emerald-800/50 bg-emerald-950/30 text-emerald-300'
                              : 'border-red-800/50 bg-red-950/30 text-red-300'
                          }`}
                        >
                          {status}
                        </span>
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap">
                        <span
                          className={`inline-block font-mono text-[10px] uppercase px-2 py-0.5 border ${
                            c.onboardingComplete
                              ? 'border-[#2B2B2B] bg-[#141414] text-neutral-300'
                              : 'border-amber-800/50 bg-amber-950/20 text-amber-300'
                          }`}
                        >
                          {c.onboardingComplete ? 'Complete' : 'Incomplete'}
                        </span>
                      </td>
                      <td className="px-3 py-3 font-mono text-[11px] text-neutral-500 tabular-nums whitespace-nowrap">
                        {formatDate(c.createdAt)}
                      </td>
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={e => {
                              e.stopPropagation();
                              selectClient(c.uid);
                            }}
                            className="border border-[#262626] bg-[#121212] px-2 py-1 text-[11px] text-neutral-300 hover:text-white hover:border-[#444]"
                          >
                            Details
                          </button>
                          <button
                            type="button"
                            onClick={e => {
                              e.stopPropagation();
                              openEdit(c);
                            }}
                            title="Edit client profile"
                            aria-label={`Edit profile for ${c.displayName || c.email}`}
                            className="border border-[#262626] bg-[#121212] p-1.5 text-neutral-400 hover:text-white hover:border-[#444]"
                          >
                            <Edit3 size={12} />
                          </button>
                          <button
                            type="button"
                            onClick={e => {
                              e.stopPropagation();
                              requestStatusToggle(c);
                            }}
                            title={status === 'Active' ? 'Suspend account' : 'Reactivate account'}
                            aria-label={
                              status === 'Active'
                                ? `Suspend ${c.displayName || c.email}`
                                : `Reactivate ${c.displayName || c.email}`
                            }
                            className={`border p-1.5 transition-colors ${
                              status === 'Active'
                                ? 'border-[#262626] bg-[#121212] text-neutral-400 hover:text-red-300 hover:border-red-900'
                                : 'border-emerald-900/50 bg-emerald-950/20 text-emerald-300 hover:text-white'
                            }`}
                          >
                            <Power size={12} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-4 py-10 text-center text-neutral-500">
                      No client accounts match your current search or filter criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Client Detail Panel */}
        {selectedClient && (
          <aside
            aria-label="Client account details"
            className="border border-[#242424] bg-[#0C0C0C] divide-y divide-[#1A1A1A]"
          >
            {/* Header & Quick Actions */}
            <div className="p-5 space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  {selectedClient.photoURL ? (
                    <img
                      src={selectedClient.photoURL}
                      alt={selectedClient.displayName || 'Client avatar'}
                      className="h-11 w-11 rounded object-cover border border-[#2A2A2A] shrink-0"
                    />
                  ) : (
                    <div className="h-11 w-11 border border-[#2A2A2A] bg-[#141414] flex items-center justify-center font-mono text-sm font-bold text-white shrink-0">
                      {(selectedClient.displayName || selectedClient.email || 'C')
                        .slice(0, 2)
                        .toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0">
                    <h3 className="text-base font-bold text-white truncate">
                      {selectedClient.displayName || 'Unnamed Client'}
                    </h3>
                    <p className="text-xs font-mono text-neutral-400 truncate">
                      {selectedClient.email}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => selectClient(null)}
                  className="p-1.5 text-neutral-400 hover:text-white border border-transparent hover:border-[#2A2A2A]"
                  aria-label="Close client details"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`font-mono text-[10px] uppercase px-2 py-0.5 border ${
                    normalizeStatus(selectedClient.status) === 'Active'
                      ? 'border-emerald-800/50 bg-emerald-950/30 text-emerald-300'
                      : 'border-red-800/50 bg-red-950/30 text-red-300'
                  }`}
                >
                  Account: {normalizeStatus(selectedClient.status)}
                </span>
                <span
                  className={`font-mono text-[10px] uppercase px-2 py-0.5 border ${
                    selectedClient.onboardingComplete
                      ? 'border-[#2B2B2B] bg-[#141414] text-neutral-300'
                      : 'border-amber-800/50 bg-amber-950/20 text-amber-300'
                  }`}
                >
                  Onboarding: {selectedClient.onboardingComplete ? 'Complete' : 'Incomplete'}
                </span>
                <span className="font-mono text-[10px] uppercase px-2 py-0.5 border border-[#262626] bg-[#121212] text-neutral-300">
                  {selectedClient.accountType}
                </span>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => openEdit(selectedClient)}
                  className="inline-flex items-center gap-1.5 border border-[#2E2E2E] bg-[#141414] px-3 py-1.5 text-xs font-medium text-white hover:border-[#4A4A4A]"
                >
                  <Edit3 size={12} />
                  <span>Edit Profile</span>
                </button>
                <button
                  type="button"
                  onClick={() => requestStatusToggle(selectedClient)}
                  className={`inline-flex items-center gap-1.5 border px-3 py-1.5 text-xs font-medium transition-colors ${
                    normalizeStatus(selectedClient.status) === 'Active'
                      ? 'border-red-900/60 bg-red-950/20 text-red-200 hover:bg-red-950/40'
                      : 'border-emerald-800/60 bg-emerald-950/20 text-emerald-200 hover:bg-emerald-950/40'
                  }`}
                >
                  <Power size={12} />
                  <span>
                    {normalizeStatus(selectedClient.status) === 'Active'
                      ? 'Suspend Account'
                      : 'Reactivate Account'}
                  </span>
                </button>
                {navigateToProjects && (
                  <button
                    type="button"
                    onClick={() => navigateToProjects(selectedClient.uid)}
                    className="inline-flex items-center gap-1.5 bg-[#FF1E1E] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#E01919]"
                  >
                    <FolderKanban size={12} />
                    <span className="tabular-nums">
                      View Client Projects ({selectedProjects.length})
                    </span>
                    <ArrowUpRight size={12} />
                  </button>
                )}
              </div>
            </div>

            {/* Profile & Organization Metadata */}
            <div className="p-5 space-y-3">
              <h4 className="text-[10px] font-mono uppercase tracking-widest text-neutral-500">
                Profile &amp; Account Metadata
              </h4>
              <dl className="grid grid-cols-2 gap-x-4 gap-y-2.5 text-xs">
                <div>
                  <dt className="text-[10px] font-mono uppercase text-neutral-500">
                    Organization / Artist
                  </dt>
                  <dd className="mt-0.5 text-white font-medium break-words">
                    {selectedClient.organizationName || '—'}
                  </dd>
                </div>
                <div>
                  <dt className="text-[10px] font-mono uppercase text-neutral-500">Account Type</dt>
                  <dd className="mt-0.5 text-neutral-200">{selectedClient.accountType}</dd>
                </div>
                <div>
                  <dt className="text-[10px] font-mono uppercase text-neutral-500">Registered</dt>
                  <dd className="mt-0.5 font-mono text-[11px] text-neutral-300 tabular-nums">
                    {formatDateTime(selectedClient.createdAt)}
                  </dd>
                </div>
                <div>
                  <dt className="text-[10px] font-mono uppercase text-neutral-500">Last Updated</dt>
                  <dd className="mt-0.5 font-mono text-[11px] text-neutral-300 tabular-nums">
                    {formatDateTime(selectedClient.updatedAt)}
                  </dd>
                </div>
                <div className="col-span-2">
                  <dt className="text-[10px] font-mono uppercase text-neutral-500">Client UID</dt>
                  <dd className="mt-0.5 font-mono text-[11px] text-neutral-400 break-all">
                    {selectedClient.uid}
                  </dd>
                </div>
              </dl>
            </div>

            {/* Associated Workspace */}
            <div className="p-5 space-y-2.5">
              <div className="flex items-center justify-between gap-2">
                <h4 className="text-[10px] font-mono uppercase tracking-widest text-neutral-500 flex items-center gap-1.5">
                  <Building2 size={12} />
                  <span>Associated Workspace</span>
                </h4>
                <div className="flex items-center gap-2">
                  {selectedWorkspace && (
                    <span className="font-mono text-[10px] uppercase text-neutral-400">
                      {selectedWorkspace.status || 'Active'}
                    </span>
                  )}
                  {selectedWorkspace && onOpenWorkspace && (
                    <button
                      type="button"
                      onClick={() => onOpenWorkspace(selectedWorkspace.id, selectedClient.uid)}
                      className="inline-flex items-center gap-1 text-[11px] text-[#FF1E1E] hover:underline"
                    >
                      <span>Open Workspace</span>
                      <ArrowUpRight size={11} />
                    </button>
                  )}
                </div>
              </div>
              {selectedWorkspace ? (
                <div className="border border-[#1E1E1E] bg-[#101010] p-3 space-y-1.5 text-xs">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-white truncate">
                      {selectedWorkspace.name}
                    </span>
                    <span className="font-mono text-[10px] text-neutral-400 shrink-0">
                      {selectedWorkspace.type}
                    </span>
                  </div>
                  {(selectedWorkspace.brand?.tagline || selectedWorkspace.description) && (
                    <p className="text-[11px] text-neutral-400 line-clamp-2">
                      {selectedWorkspace.brand?.tagline || selectedWorkspace.description}
                    </p>
                  )}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-[10px] font-mono text-neutral-500">
                    <span className="truncate">ID: {selectedWorkspace.id}</span>
                    {Array.isArray(selectedWorkspace.contractedPackageIds) && (
                      <span className="tabular-nums">
                        {selectedWorkspace.contractedPackageIds.length} contracted package
                        {selectedWorkspace.contractedPackageIds.length === 1 ? '' : 's'}
                      </span>
                    )}
                  </div>
                </div>
              ) : (
                <p className="text-xs text-neutral-500">
                  No workspace is currently linked to this client profile.
                </p>
              )}
            </div>

            {/* Client Projects Summary */}
            <div className="p-5 space-y-2.5">
              <div className="flex items-center justify-between">
                <h4 className="text-[10px] font-mono uppercase tracking-widest text-neutral-500 flex items-center gap-1.5">
                  <FolderKanban size={12} />
                  <span className="tabular-nums">Client Projects ({selectedProjects.length})</span>
                </h4>
                {navigateToProjects && selectedProjects.length > 0 && (
                  <button
                    type="button"
                    onClick={() => navigateToProjects(selectedClient.uid)}
                    className="text-[11px] text-[#FF1E1E] hover:underline"
                  >
                    Open in Projects
                  </button>
                )}
              </div>

              {projectsLoading ? (
                <p className="text-xs text-neutral-500">Loading client projects…</p>
              ) : projectsError ? (
                <p className="text-xs text-red-300">{projectsError}</p>
              ) : selectedProjects.length === 0 ? (
                <p className="text-xs text-neutral-500">
                  No production projects recorded for this client yet.
                </p>
              ) : (
                <ul className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {selectedProjects.map(project => (
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

            {/* Real Admin Audit History */}
            <div className="p-5 space-y-2.5">
              <h4 className="text-[10px] font-mono uppercase tracking-widest text-neutral-500 flex items-center gap-1.5">
                <History size={12} />
                <span>Account Admin History</span>
              </h4>

              {auditLoading ? (
                <p className="text-xs text-neutral-500">Loading account history…</p>
              ) : auditError ? (
                <p className="text-xs text-red-300">{auditError}</p>
              ) : selectedAuditLogs.length === 0 ? (
                <p className="text-xs text-neutral-500">
                  No administrative audit records stored for this client yet.
                </p>
              ) : (
                <ul className="space-y-2 max-h-52 overflow-y-auto pr-1">
                  {selectedAuditLogs.map(entry => (
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

      {/* Edit Client Profile Modal (Permitted Fields Only) */}
      <Modal
        isOpen={editOpen}
        onClose={() => {
          if (saveStatus !== 'saving') {
            setEditOpen(false);
            setEditingClient(null);
            setEditModalError('');
          }
        }}
        maxWidth="lg"
        title="Edit client profile"
        subtitle={editingClient?.email}
      >
        <form
          onSubmit={e => {
            e.preventDefault();
            void saveClient();
          }}
          className="space-y-4"
        >
          {editModalError && (
            <p
              role="alert"
              className="rounded border border-red-500/30 bg-red-950/20 p-3 text-xs text-red-300"
            >
              {editModalError}
            </p>
          )}
          <div className="rounded border border-[#242424] bg-[#0C0C0C] px-3 py-2 text-[11px] font-mono text-neutral-400">
            Email ({editingClient?.email || '—'}) and account role/status are protected. Use Suspend or Reactivate controls for account status changes.
          </div>
          <div>
            <label
              htmlFor="client-edit-display-name"
              className="mb-1 block text-[10px] font-mono uppercase text-neutral-500"
            >
              Display name *
            </label>
            <input
              id="client-edit-display-name"
              required
              maxLength={100}
              value={editForm.displayName}
              onChange={e => setEditForm(f => ({ ...f, displayName: e.target.value }))}
              className="w-full rounded border border-[#333] bg-[#141414] px-3 py-2 text-sm text-white focus:border-[#FF1E1E] focus:outline-none"
            />
          </div>
          <div>
            <label
              htmlFor="client-edit-org-name"
              className="mb-1 block text-[10px] font-mono uppercase text-neutral-500"
            >
              Organization / artist name *
            </label>
            <input
              id="client-edit-org-name"
              required
              maxLength={100}
              value={editForm.organizationName}
              onChange={e => setEditForm(f => ({ ...f, organizationName: e.target.value }))}
              className="w-full rounded border border-[#333] bg-[#141414] px-3 py-2 text-sm text-white focus:border-[#FF1E1E] focus:outline-none"
            />
          </div>
          <div>
            <label
              htmlFor="client-edit-account-type"
              className="mb-1 block text-[10px] font-mono uppercase text-neutral-500"
            >
              Account type
            </label>
            <select
              id="client-edit-account-type"
              value={editForm.accountType}
              onChange={e =>
                setEditForm(f => ({
                  ...f,
                  accountType: e.target.value as 'Artist' | 'Brand' | 'Company',
                }))
              }
              className="w-full rounded border border-[#333] bg-[#141414] px-3 py-2 text-sm text-white focus:border-[#FF1E1E] focus:outline-none"
            >
              <option value="Artist">Artist</option>
              <option value="Brand">Brand</option>
              <option value="Company">Company</option>
            </select>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              disabled={saveStatus === 'saving'}
              onClick={() => {
                setEditOpen(false);
                setEditingClient(null);
                setEditModalError('');
              }}
              className="rounded border border-[#333] px-4 py-2 text-sm text-white disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saveStatus === 'saving'}
              className="rounded bg-[#FF1E1E] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
            >
              {saveStatus === 'saving' ? 'Saving…' : 'Save changes'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Suspend / Reactivate Confirmation Modal */}
      <Modal
        isOpen={Boolean(statusConfirmTarget)}
        onClose={() => {
          if (!statusConfirmPending) {
            setStatusConfirmTarget(null);
            setStatusModalError('');
          }
        }}
        maxWidth="md"
        title={
          statusConfirmTarget?.nextStatus === 'Suspended'
            ? 'Suspend Client Account'
            : 'Reactivate Client Account'
        }
        subtitle={statusConfirmTarget?.email || statusConfirmTarget?.displayName}
      >
        {statusConfirmTarget && (
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
              {statusConfirmTarget.nextStatus === 'Suspended'
                ? `Are you sure you want to suspend ${statusConfirmTarget.displayName}? They will lose active client workspace access until reactivated by an administrator.`
                : `Reactivate ${statusConfirmTarget.displayName} and restore active client workspace access?`}
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                disabled={statusConfirmPending}
                onClick={() => {
                  setStatusConfirmTarget(null);
                  setStatusModalError('');
                }}
                className="rounded border border-[#333] px-4 py-2 text-sm text-neutral-300 hover:text-white disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={statusConfirmPending}
                onClick={() => void confirmToggleClientStatus()}
                className="rounded bg-[#FF1E1E] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
              >
                {statusConfirmPending
                  ? 'Updating…'
                  : statusConfirmTarget.nextStatus === 'Suspended'
                    ? 'Suspend Account'
                    : 'Reactivate Account'}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ClientsDirectory;
