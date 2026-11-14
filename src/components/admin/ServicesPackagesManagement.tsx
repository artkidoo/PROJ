import React, { useEffect, useMemo, useState } from 'react';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import {
  AlertCircle,
  ArrowUpRight,
  Building2,
  Check,
  CheckCircle2,
  Edit3,
  Eye,
  EyeOff,
  History,
  Info,
  Package,
  Plus,
  Power,
  Search,
  ShieldAlert,
  X,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { db, functions } from '../../lib/firebase';
import {
  ServiceCategory,
  ServicePackage,
  ServiceTier,
  Workspace,
} from '../../types';
import { Modal } from '../common/Modal';

interface Props {
  initialSelectedPackageId?: string;
  onSelectedPackageChange?: (packageId: string | null) => void;
  onOpenWorkspace?: (workspaceId: string) => void;
}

interface CatalogAuditEntry {
  id: string;
  action: string;
  actorUid: string;
  actorName: string;
  details: string;
  createdAt: string;
}

const SERVICE_CATEGORIES: ServiceCategory[] = [
  'Music Release Promotion',
  'Cover Artwork & Visuals',
  'Motion Design & Video',
  'Brand Identity System',
  'Business & Corporate Creative',
  'Executive Creative Retainer',
];

const SERVICE_TIERS: ServiceTier[] = ['Essential', 'Professional', 'Flagship / Custom'];
const BILLING_TYPES: Array<ServicePackage['billingType']> = [
  'One-Time',
  'Per-Release',
  'Monthly Retainer',
];
const TARGET_AUDIENCES: Array<ServicePackage['targetAudience']> = ['Artist', 'Brand', 'Both'];

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

function slugifyPackageId(name: string): string {
  const base = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 64);
  return base || `pkg-${crypto.randomUUID().slice(0, 8)}`;
}

export const ServicesPackagesManagement: React.FC<Props> = ({
  initialSelectedPackageId = '',
  onSelectedPackageChange,
  onOpenWorkspace,
}) => {
  const { firebaseUser, canAccessAdminCenter } = useApp();

  const [packages, setPackages] = useState<ServicePackage[]>([]);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [workspaceNotice, setWorkspaceNotice] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [audienceFilter, setAudienceFilter] = useState<string>('All');
  const [statusFilter, setStatusFilter] = useState<string>('All');

  const [selectedPackageId, setSelectedPackageId] = useState<string | null>(
    initialSelectedPackageId || null
  );

  // Scoped audit history for selected package
  const [auditLogs, setAuditLogs] = useState<CatalogAuditEntry[]>([]);
  const [auditLoading, setAuditLoading] = useState(false);
  const [auditError, setAuditError] = useState<string | null>(null);

  const [actionSuccess, setActionSuccess] = useState('');
  const [actionError, setActionError] = useState('');

  // Create / Edit modal state
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingPackage, setEditingPackage] = useState<ServicePackage | null>(null);
  const [formId, setFormId] = useState('');
  const [formName, setFormName] = useState('');
  const [formCategory, setFormCategory] = useState<ServiceCategory>('Music Release Promotion');
  const [formTier, setFormTier] = useState<ServiceTier>('Professional');
  const [formPriceUsd, setFormPriceUsd] = useState('1850');
  const [formBillingType, setFormBillingType] =
    useState<ServicePackage['billingType']>('Per-Release');
  const [formTurnaroundDays, setFormTurnaroundDays] = useState('5');
  const [formRevisionLimit, setFormRevisionLimit] = useState('3');
  const [formTargetAudience, setFormTargetAudience] =
    useState<ServicePackage['targetAudience']>('Artist');
  const [formDescription, setFormDescription] = useState('');
  const [formDeliverablesText, setFormDeliverablesText] = useState('');
  const [formIsActive, setFormIsActive] = useState(true);
  const [editorError, setEditorError] = useState('');
  const [editorConfirmStep, setEditorConfirmStep] = useState(false);
  const [editorSaving, setEditorSaving] = useState(false);

  // Activate / Deactivate confirmation modal
  const [activeToggleTarget, setActiveToggleTarget] = useState<{
    pkg: ServicePackage;
    nextIsActive: boolean;
    contractedCount: number;
  } | null>(null);
  const [toggleSaving, setToggleSaving] = useState(false);
  const [toggleError, setToggleError] = useState('');

  useEffect(() => {
    if (initialSelectedPackageId) {
      setSelectedPackageId(initialSelectedPackageId);
    }
  }, [initialSelectedPackageId]);

  const selectPackage = (id: string | null) => {
    setSelectedPackageId(id);
    onSelectedPackageChange?.(id);
  };

  // Catalog + workspaces live listeners (active admin only)
  useEffect(() => {
    if (!firebaseUser || !canAccessAdminCenter) {
      setPackages([]);
      setWorkspaces([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    setWorkspaceNotice(null);

    const unsubServices = onSnapshot(
      collection(db, 'services'),
      snap => {
        const list = snap.docs
          .map(d => ({ id: d.id, ...(d.data() as Omit<ServicePackage, 'id'>) }))
          .sort(
            (a, b) =>
              toTimestampMs(b.updatedAt || b.createdAt) -
              toTimestampMs(a.updatedAt || a.createdAt)
          );
        setPackages(list);
        setLoading(false);
        setError(null);
      },
      err => {
        setError(err?.message || 'Failed to load services and packages.');
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
        setWorkspaceNotice(err?.message || 'Workspace contract references could not be loaded.');
      }
    );

    return () => {
      unsubServices();
      unsubWorkspaces();
    };
  }, [firebaseUser, canAccessAdminCenter]);

  // Scoped audit logs for selected package
  useEffect(() => {
    setAuditLogs([]);
    setAuditError(null);

    if (!firebaseUser || !canAccessAdminCenter || !selectedPackageId) {
      setAuditLoading(false);
      return;
    }

    setAuditLoading(true);
    const unsubAudit = onSnapshot(
      query(collection(db, 'adminAuditLogs'), where('target', '==', selectedPackageId)),
      snap => {
        const entries = snap.docs
          .map(d => {
            const data = d.data() as Record<string, any>;
            return {
              id: d.id,
              action: data.action || 'catalog_action',
              actorUid: data.actorUid || '',
              actorName: data.actorName || data.actorUid || 'Administrator',
              details: formatAuditDetails(data.details),
              createdAt: data.createdAt || '',
            } as CatalogAuditEntry;
          })
          .sort((a, b) => toTimestampMs(b.createdAt) - toTimestampMs(a.createdAt))
          .slice(0, 20);
        setAuditLogs(entries);
        setAuditLoading(false);
        setAuditError(null);
      },
      err => {
        setAuditError(err?.message || 'Unable to load catalog audit history.');
        setAuditLoading(false);
      }
    );

    return () => unsubAudit();
  }, [firebaseUser, canAccessAdminCenter, selectedPackageId]);

  // Escape closes detail panel when modals are closed
  useEffect(() => {
    if (!selectedPackageId || editorOpen || activeToggleTarget) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') selectPackage(null);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [selectedPackageId, editorOpen, activeToggleTarget]);

  const workspacesByPackageId = useMemo(() => {
    const map = new Map<string, Workspace[]>();
    workspaces.forEach(ws => {
      (ws.contractedPackageIds || []).forEach(pkgId => {
        const list = map.get(pkgId) || [];
        list.push(ws);
        map.set(pkgId, list);
      });
    });
    return map;
  }, [workspaces]);

  const selectedPackage = useMemo(
    () => (selectedPackageId ? packages.find(p => p.id === selectedPackageId) || null : null),
    [packages, selectedPackageId]
  );

  const selectedContractedWorkspaces = useMemo(
    () => (selectedPackage ? workspacesByPackageId.get(selectedPackage.id) || [] : []),
    [selectedPackage, workspacesByPackageId]
  );

  const stats = useMemo(() => {
    const total = packages.length;
    const active = packages.filter(p => p.isActive).length;
    const inactive = total - active;
    const contractedCount = packages.filter(
      p => (workspacesByPackageId.get(p.id) || []).length > 0
    ).length;
    return { total, active, inactive, contractedCount };
  }, [packages, workspacesByPackageId]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return packages.filter(pkg => {
      const matchesSearch =
        !q ||
        pkg.name.toLowerCase().includes(q) ||
        pkg.id.toLowerCase().includes(q) ||
        pkg.description.toLowerCase().includes(q) ||
        pkg.category.toLowerCase().includes(q) ||
        pkg.deliverables.some(d => d.toLowerCase().includes(q));

      const matchesCategory = categoryFilter === 'All' || pkg.category === categoryFilter;
      const matchesAudience =
        audienceFilter === 'All' ||
        pkg.targetAudience === audienceFilter ||
        (audienceFilter !== 'Both' && pkg.targetAudience === 'Both');
      const matchesStatus =
        statusFilter === 'All' ||
        (statusFilter === 'Active' && pkg.isActive) ||
        (statusFilter === 'Inactive' && !pkg.isActive);

      return matchesSearch && matchesCategory && matchesAudience && matchesStatus;
    });
  }, [packages, search, categoryFilter, audienceFilter, statusFilter]);

  const hasActiveFilters =
    Boolean(search.trim()) ||
    categoryFilter !== 'All' ||
    audienceFilter !== 'All' ||
    statusFilter !== 'All';

  const clearFilters = () => {
    setSearch('');
    setCategoryFilter('All');
    setAudienceFilter('All');
    setStatusFilter('All');
  };

  const openCreateModal = () => {
    setEditingPackage(null);
    setFormId('');
    setFormName('');
    setFormCategory('Music Release Promotion');
    setFormTier('Professional');
    setFormPriceUsd('1850');
    setFormBillingType('Per-Release');
    setFormTurnaroundDays('5');
    setFormRevisionLimit('3');
    setFormTargetAudience('Artist');
    setFormDescription('');
    setFormDeliverablesText('');
    setFormIsActive(true);
    setEditorError('');
    setEditorConfirmStep(false);
    setActionError('');
    setActionSuccess('');
    setEditorOpen(true);
  };

  const openEditModal = (pkg: ServicePackage) => {
    setEditingPackage(pkg);
    setFormId(pkg.id);
    setFormName(pkg.name);
    setFormCategory(pkg.category);
    setFormTier(pkg.tier);
    setFormPriceUsd(String(pkg.priceUsd));
    setFormBillingType(pkg.billingType);
    setFormTurnaroundDays(String(pkg.turnaroundDays));
    setFormRevisionLimit(String(pkg.revisionLimit));
    setFormTargetAudience(pkg.targetAudience);
    setFormDescription(pkg.description || '');
    setFormDeliverablesText((pkg.deliverables || []).join('\n'));
    setFormIsActive(Boolean(pkg.isActive));
    setEditorError('');
    setEditorConfirmStep(false);
    setActionError('');
    setActionSuccess('');
    setEditorOpen(true);
  };

  const validateEditorPayload = () => {
    const trimmedName = formName.trim();
    if (!trimmedName || trimmedName.length > 120) {
      return { error: 'Service/package name is required (1–120 characters).' };
    }

    const candidateId = editingPackage
      ? editingPackage.id
      : (formId.trim() || slugifyPackageId(trimmedName));

    if (!/^[a-zA-Z0-9_-]{1,128}$/.test(candidateId)) {
      return {
        error:
          'Identifier must be 1–128 characters containing only letters, numbers, hyphens, or underscores.',
      };
    }

    if (!editingPackage && packages.some(p => p.id === candidateId)) {
      return {
        error: `A catalog entry with ID "${candidateId}" already exists. Choose a unique identifier or edit the existing package.`,
      };
    }

    const parsedPrice = Number(formPriceUsd);
    if (!Number.isFinite(parsedPrice) || parsedPrice < 0 || parsedPrice > 10000000) {
      return { error: 'Price (USD) must be a valid number between 0 and 10,000,000.' };
    }

    const parsedTurnaround = Number(formTurnaroundDays);
    if (!Number.isInteger(parsedTurnaround) || parsedTurnaround < 1 || parsedTurnaround > 365) {
      return { error: 'Turnaround days must be a whole number between 1 and 365.' };
    }

    const parsedRevisions = Number(formRevisionLimit);
    if (!Number.isInteger(parsedRevisions) || parsedRevisions < -1 || parsedRevisions > 100) {
      return {
        error: 'Revision limit must be a whole number between -1 (unlimited) and 100.',
      };
    }

    const trimmedDesc = formDescription.trim();
    if (trimmedDesc.length > 2000) {
      return { error: 'Description must be 2,000 characters or fewer.' };
    }

    const deliverables = formDeliverablesText
      .split('\n')
      .map(line => line.trim())
      .filter(Boolean);

    if (deliverables.length > 50) {
      return { error: 'Include up to 50 deliverable line items.' };
    }
    if (deliverables.some(item => item.length > 200)) {
      return { error: 'Each deliverable item must be 200 characters or fewer.' };
    }

    return {
      payload: {
        id: candidateId,
        name: trimmedName,
        category: formCategory,
        tier: formTier,
        priceUsd: parsedPrice,
        billingType: formBillingType,
        turnaroundDays: parsedTurnaround,
        revisionLimit: parsedRevisions,
        targetAudience: formTargetAudience,
        description: trimmedDesc,
        deliverables,
        isActive: Boolean(formIsActive),
      },
    };
  };

  const handleEditorSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const validation = validateEditorPayload();
    if ('error' in validation && validation.error) {
      setEditorError(validation.error);
      setEditorConfirmStep(false);
      return;
    }

    const payload = validation.payload!;
    setEditorError('');

    // Require explicit confirmation step before updating an existing catalog item
    if (editingPackage && !editorConfirmStep) {
      setEditorConfirmStep(true);
      return;
    }

    setEditorSaving(true);
    setActionError('');
    setActionSuccess('');
    try {
      await httpsCallable(functions, 'adminSaveServicePackage')(payload);
      setEditorOpen(false);
      setEditingPackage(null);
      setEditorConfirmStep(false);
      selectPackage(payload.id);
      setActionSuccess(
        editingPackage
          ? `Saved changes to "${payload.name}". Existing workspace contracts remain unchanged.`
          : `Created service package "${payload.name}" (${payload.id}).`
      );
    } catch (err: any) {
      setEditorError(err?.message || 'Unable to save service package.');
      setEditorConfirmStep(false);
    } finally {
      setEditorSaving(false);
    }
  };

  const requestToggleActive = (pkg: ServicePackage) => {
    setToggleError('');
    setActionError('');
    setActionSuccess('');
    setActiveToggleTarget({
      pkg,
      nextIsActive: !pkg.isActive,
      contractedCount: (workspacesByPackageId.get(pkg.id) || []).length,
    });
  };

  const confirmToggleActive = async () => {
    if (!activeToggleTarget) return;
    setToggleSaving(true);
    setToggleError('');
    setActionError('');
    setActionSuccess('');
    try {
      await httpsCallable(functions, 'adminSetServicePackageActive')({
        id: activeToggleTarget.pkg.id,
        isActive: activeToggleTarget.nextIsActive,
      });
      setActionSuccess(
        activeToggleTarget.nextIsActive
          ? `Activated "${activeToggleTarget.pkg.name}". It is now visible on the public Services and Pricing pages.`
          : `Deactivated "${activeToggleTarget.pkg.name}". It is hidden from public offerings while preserving existing workspace contracts.`
      );
      setActiveToggleTarget(null);
    } catch (err: any) {
      setToggleError(err?.message || 'Unable to update package availability.');
    } finally {
      setToggleSaving(false);
    }
  };

  if (!firebaseUser || !canAccessAdminCenter) {
    return (
      <div className="border border-red-900/40 bg-[#0C0C0C] p-6 text-sm text-red-300 flex items-center gap-3">
        <ShieldAlert size={18} className="text-[#FF1E1E] shrink-0" />
        <span>
          Active platform administrator authentication is required to manage services and packages.
        </span>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="border border-[#1A1A1A] bg-[#0C0C0C] py-16 text-center text-sm text-neutral-400">
        Loading services and packages catalog…
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
      {/* Catalog Summary Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="border border-[#1A1A1A] bg-[#0C0C0C] px-4 py-3">
          <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-widest text-neutral-500">
            <span>Catalog Entries</span>
            <Package size={13} className="text-neutral-500" />
          </div>
          <p className="mt-1.5 text-2xl font-black text-white tabular-nums">{stats.total}</p>
        </div>
        <div className="border border-[#1A1A1A] bg-[#0C0C0C] px-4 py-3">
          <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-widest text-neutral-500">
            <span>Active (Public)</span>
            <Eye size={13} className="text-emerald-400" />
          </div>
          <p className="mt-1.5 text-2xl font-black text-white tabular-nums">{stats.active}</p>
        </div>
        <div className="border border-[#1A1A1A] bg-[#0C0C0C] px-4 py-3">
          <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-widest text-neutral-500">
            <span>Inactive (Hidden)</span>
            <EyeOff size={13} className="text-neutral-400" />
          </div>
          <p className="mt-1.5 text-2xl font-black text-white tabular-nums">{stats.inactive}</p>
        </div>
        <div className="border border-[#1A1A1A] bg-[#0C0C0C] px-4 py-3">
          <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-widest text-neutral-500">
            <span>Contracted Offerings</span>
            <Building2 size={13} className="text-amber-400" />
          </div>
          <p className="mt-1.5 text-2xl font-black text-white tabular-nums">
            {stats.contractedCount}
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

      {/* Search, Filters & Create Action */}
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
              placeholder="Search service name, deliverables, category, or ID…"
              aria-label="Search services and packages"
              className="w-full bg-[#121212] border border-[#242424] text-white pl-9 pr-3 py-2 text-xs placeholder-neutral-500 focus:border-[#FF1E1E] focus:outline-none"
            />
          </div>

          <div className="md:col-span-3">
            <select
              aria-label="Filter by category"
              value={categoryFilter}
              onChange={e => setCategoryFilter(e.target.value)}
              className="w-full bg-[#121212] border border-[#242424] text-white px-3 py-2 text-xs focus:border-[#FF1E1E] focus:outline-none"
            >
              <option value="All">All Categories</option>
              {SERVICE_CATEGORIES.map(category => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-2">
            <select
              aria-label="Filter by target audience"
              value={audienceFilter}
              onChange={e => setAudienceFilter(e.target.value)}
              className="w-full bg-[#121212] border border-[#242424] text-white px-3 py-2 text-xs focus:border-[#FF1E1E] focus:outline-none"
            >
              <option value="All">All Audiences</option>
              <option value="Artist">Artist</option>
              <option value="Brand">Brand</option>
              <option value="Both">Both</option>
            </select>
          </div>

          <div className="md:col-span-3 flex items-center gap-2">
            <select
              aria-label="Filter by active status"
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="flex-1 bg-[#121212] border border-[#242424] text-white px-3 py-2 text-xs focus:border-[#FF1E1E] focus:outline-none"
            >
              <option value="All">All Statuses</option>
              <option value="Active">Active (Public)</option>
              <option value="Inactive">Inactive (Hidden)</option>
            </select>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="border border-[#2A2A2A] bg-[#141414] px-2.5 py-2 text-xs text-neutral-300 hover:text-white hover:border-[#444] shrink-0"
              >
                Clear
              </button>
            )}
            <button
              type="button"
              onClick={openCreateModal}
              className="inline-flex items-center gap-1.5 bg-[#FF1E1E] hover:bg-[#E01919] px-3 py-2 text-xs font-semibold text-white shrink-0"
            >
              <Plus size={13} />
              <span>New Package</span>
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono text-neutral-500">
          <span className="tabular-nums">
            Showing {filtered.length} of {packages.length} catalog offering
            {packages.length === 1 ? '' : 's'} · Single source for Public Services &amp; Pricing
          </span>
          {selectedPackage && (
            <span className="text-neutral-400 truncate max-w-[280px]">
              Inspecting: {selectedPackage.name}
            </span>
          )}
        </div>
      </div>

      {packages.length === 0 ? (
        <div className="border border-[#1A1A1A] bg-[#0C0C0C] py-16 text-center space-y-3">
          <Package size={24} className="mx-auto text-neutral-500" />
          <p className="text-sm font-semibold text-white">No services or packages in catalog</p>
          <p className="text-xs text-neutral-500 max-w-md mx-auto">
            Publish your first creative service package so it can be contracted by client workspaces
            and displayed on the public Services &amp; Pricing pages.
          </p>
          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex items-center gap-1.5 bg-[#FF1E1E] px-4 py-2 text-xs font-semibold text-white"
          >
            <Plus size={13} />
            <span>Create Service Package</span>
          </button>
        </div>
      ) : (
        <div
          className={`grid gap-5 items-start ${
            selectedPackage
              ? 'xl:grid-cols-[minmax(0,1.45fr)_minmax(380px,1fr)]'
              : 'grid-cols-1'
          }`}
        >
          {/* Catalog Directory Table */}
          <div className="border border-[#1A1A1A] bg-[#0C0C0C] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="bg-[#080808] text-neutral-500 font-mono text-[10px] uppercase tracking-widest border-b border-[#1A1A1A]">
                  <tr>
                    <th className="text-left px-4 py-3">Service / Package</th>
                    <th className="text-left px-3 py-3">Category &amp; Tier</th>
                    <th className="text-left px-3 py-3">Audience</th>
                    <th className="text-left px-3 py-3">Pricing (USD)</th>
                    <th className="text-left px-3 py-3">Inclusions</th>
                    <th className="text-left px-3 py-3">Workspaces</th>
                    <th className="text-left px-3 py-3">Status</th>
                    <th className="text-right px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#161616]">
                  {filtered.map(pkg => {
                    const contractedWorkspaces = workspacesByPackageId.get(pkg.id) || [];
                    const isSelected = selectedPackageId === pkg.id;
                    return (
                      <tr
                        key={pkg.id}
                        onClick={() => selectPackage(pkg.id)}
                        className={`cursor-pointer transition-colors ${
                          isSelected ? 'bg-[#171010]' : 'hover:bg-[#121212]'
                        } ${!pkg.isActive ? 'opacity-75' : ''}`}
                      >
                        <td className="px-4 py-3 min-w-[200px]">
                          <div className="font-semibold text-white truncate max-w-[230px]">
                            {pkg.name}
                          </div>
                          <div className="text-[11px] text-neutral-400 truncate max-w-[230px] mt-0.5">
                            {pkg.description || pkg.id}
                          </div>
                        </td>

                        <td className="px-3 py-3 min-w-[160px]">
                          <div className="text-neutral-200 truncate max-w-[180px]">
                            {pkg.category}
                          </div>
                          <div className="text-[10px] font-mono text-neutral-500">{pkg.tier}</div>
                        </td>

                        <td className="px-3 py-3 whitespace-nowrap text-neutral-300">
                          {pkg.targetAudience}
                        </td>

                        <td className="px-3 py-3 whitespace-nowrap">
                          <div className="font-mono font-semibold text-white tabular-nums">
                            ${Number(pkg.priceUsd || 0).toLocaleString()} USD
                          </div>
                          <div className="text-[10px] font-mono text-neutral-500">
                            {pkg.billingType}
                          </div>
                        </td>

                        <td className="px-3 py-3 whitespace-nowrap font-mono text-[11px] text-neutral-400 tabular-nums">
                          {pkg.deliverables?.length || 0} item
                          {(pkg.deliverables?.length || 0) === 1 ? '' : 's'}
                        </td>

                        <td className="px-3 py-3 whitespace-nowrap font-mono text-[11px] text-neutral-400 tabular-nums">
                          {contractedWorkspaces.length}
                        </td>

                        <td className="px-3 py-3 whitespace-nowrap">
                          <span
                            className={`inline-block font-mono text-[10px] uppercase px-2 py-0.5 border ${
                              pkg.isActive
                                ? 'border-emerald-800/50 bg-emerald-950/30 text-emerald-300'
                                : 'border-neutral-700 bg-neutral-900 text-neutral-400'
                            }`}
                          >
                            {pkg.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>

                        <td className="px-4 py-3 text-right whitespace-nowrap">
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={e => {
                                e.stopPropagation();
                                selectPackage(pkg.id);
                              }}
                              className="border border-[#262626] bg-[#121212] px-2 py-1 text-[11px] text-neutral-300 hover:text-white hover:border-[#444]"
                            >
                              Details
                            </button>
                            <button
                              type="button"
                              onClick={e => {
                                e.stopPropagation();
                                openEditModal(pkg);
                              }}
                              title="Edit package"
                              aria-label={`Edit ${pkg.name}`}
                              className="border border-[#262626] bg-[#121212] p-1.5 text-neutral-400 hover:text-white hover:border-[#444]"
                            >
                              <Edit3 size={12} />
                            </button>
                            <button
                              type="button"
                              onClick={e => {
                                e.stopPropagation();
                                requestToggleActive(pkg);
                              }}
                              title={pkg.isActive ? 'Deactivate package' : 'Activate package'}
                              aria-label={
                                pkg.isActive ? `Deactivate ${pkg.name}` : `Activate ${pkg.name}`
                              }
                              className={`border p-1.5 transition-colors ${
                                pkg.isActive
                                  ? 'border-[#262626] bg-[#121212] text-neutral-400 hover:text-amber-300 hover:border-amber-800'
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
                        No services or packages match your current search or filter criteria.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Package Detail Panel */}
          {selectedPackage && (
            <aside
              aria-label="Service package details"
              className="border border-[#242424] bg-[#0C0C0C] divide-y divide-[#1A1A1A]"
            >
              {/* Header & Controlled Actions */}
              <div className="p-5 space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[10px] font-mono uppercase tracking-widest text-[#FF1E1E]">
                      {selectedPackage.category}
                    </p>
                    <h3 className="mt-1 text-base font-bold text-white break-words">
                      {selectedPackage.name}
                    </h3>
                    <p className="mt-0.5 text-[11px] font-mono text-neutral-500 break-all">
                      ID: {selectedPackage.id}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => selectPackage(null)}
                    className="p-1.5 text-neutral-400 hover:text-white border border-transparent hover:border-[#2A2A2A]"
                    aria-label="Close package details"
                  >
                    <X size={16} />
                  </button>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`font-mono text-[10px] uppercase px-2 py-0.5 border ${
                      selectedPackage.isActive
                        ? 'border-emerald-800/50 bg-emerald-950/30 text-emerald-300'
                        : 'border-neutral-700 bg-neutral-900 text-neutral-400'
                    }`}
                  >
                    {selectedPackage.isActive ? 'Active · Publicly Listed' : 'Inactive · Hidden'}
                  </span>
                  <span className="font-mono text-[10px] uppercase px-2 py-0.5 border border-[#262626] bg-[#121212] text-neutral-300">
                    Tier: {selectedPackage.tier}
                  </span>
                  <span className="font-mono text-[10px] uppercase px-2 py-0.5 border border-[#262626] bg-[#121212] text-neutral-300">
                    Audience: {selectedPackage.targetAudience}
                  </span>
                </div>

                <div className="flex flex-wrap gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => openEditModal(selectedPackage)}
                    className="inline-flex items-center gap-1.5 border border-[#2E2E2E] bg-[#141414] px-3 py-1.5 text-xs font-medium text-white hover:border-[#4A4A4A]"
                  >
                    <Edit3 size={12} />
                    <span>Edit Service Package</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => requestToggleActive(selectedPackage)}
                    className={`inline-flex items-center gap-1.5 border px-3 py-1.5 text-xs font-medium transition-colors ${
                      selectedPackage.isActive
                        ? 'border-amber-900/60 bg-amber-950/20 text-amber-200 hover:bg-amber-950/40'
                        : 'border-emerald-800/60 bg-emerald-950/20 text-emerald-200 hover:bg-emerald-950/40'
                    }`}
                  >
                    <Power size={12} />
                    <span>{selectedPackage.isActive ? 'Deactivate' : 'Activate'}</span>
                  </button>
                </div>
              </div>

              {/* Service Overview & Package Commercial Terms */}
              <div className="p-5 space-y-3">
                <h4 className="text-[10px] font-mono uppercase tracking-widest text-neutral-500">
                  Service Overview &amp; Commercial Terms
                </h4>
                <p className="text-xs text-neutral-300 leading-relaxed whitespace-pre-wrap">
                  {selectedPackage.description || 'No description provided.'}
                </p>
                <dl className="grid grid-cols-2 gap-x-4 gap-y-2.5 text-xs pt-1">
                  <div>
                    <dt className="text-[10px] font-mono uppercase text-neutral-500">Price</dt>
                    <dd className="mt-0.5 font-mono font-bold text-white tabular-nums">
                      ${Number(selectedPackage.priceUsd || 0).toLocaleString()} USD
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[10px] font-mono uppercase text-neutral-500">
                      Billing Model
                    </dt>
                    <dd className="mt-0.5 text-neutral-200">{selectedPackage.billingType}</dd>
                  </div>
                  <div>
                    <dt className="text-[10px] font-mono uppercase text-neutral-500">Turnaround</dt>
                    <dd className="mt-0.5 font-mono text-neutral-200 tabular-nums">
                      {selectedPackage.turnaroundDays} business day
                      {selectedPackage.turnaroundDays === 1 ? '' : 's'}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[10px] font-mono uppercase text-neutral-500">
                      Revision Cap
                    </dt>
                    <dd className="mt-0.5 font-mono text-neutral-200 tabular-nums">
                      {selectedPackage.revisionLimit < 0
                        ? 'Unlimited'
                        : `${selectedPackage.revisionLimit} round${
                            selectedPackage.revisionLimit === 1 ? '' : 's'
                          }`}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[10px] font-mono uppercase text-neutral-500">Created</dt>
                    <dd className="mt-0.5 font-mono text-[11px] text-neutral-400 tabular-nums">
                      {formatDateTime(selectedPackage.createdAt)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[10px] font-mono uppercase text-neutral-500">
                      Last Updated
                    </dt>
                    <dd className="mt-0.5 font-mono text-[11px] text-neutral-400 tabular-nums">
                      {formatDateTime(selectedPackage.updatedAt)}
                    </dd>
                  </div>
                </dl>
              </div>

              {/* Included Deliverables / Services */}
              <div className="p-5 space-y-2.5">
                <h4 className="text-[10px] font-mono uppercase tracking-widest text-neutral-500">
                  Included Deliverables ({selectedPackage.deliverables?.length || 0})
                </h4>
                {!selectedPackage.deliverables || selectedPackage.deliverables.length === 0 ? (
                  <p className="text-xs text-neutral-500">
                    No itemized deliverables recorded for this package.
                  </p>
                ) : (
                  <ul className="space-y-1.5">
                    {selectedPackage.deliverables.map((item, idx) => (
                      <li key={`${item}-${idx}`} className="flex items-start gap-2 text-xs text-neutral-300">
                        <Check size={13} className="text-emerald-400 mt-0.5 shrink-0" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Contracted Workspaces */}
              <div className="p-5 space-y-2.5">
                <h4 className="text-[10px] font-mono uppercase tracking-widest text-neutral-500 flex items-center gap-1.5">
                  <Building2 size={12} />
                  <span className="tabular-nums">
                    Contracted Workspaces ({selectedContractedWorkspaces.length})
                  </span>
                </h4>
                {selectedContractedWorkspaces.length === 0 ? (
                  <p className="text-xs text-neutral-500">
                    No client workspaces currently reference this package in{' '}
                    <code className="font-mono">contractedPackageIds</code>.
                  </p>
                ) : (
                  <ul className="space-y-1.5">
                    {selectedContractedWorkspaces.map(ws => (
                      <li
                        key={ws.id}
                        className="border border-[#1E1E1E] bg-[#101010] px-3 py-2 text-xs flex items-center justify-between gap-2"
                      >
                        <div className="min-w-0">
                          <span className="block font-semibold text-white truncate">{ws.name}</span>
                          <span className="block font-mono text-[10px] text-neutral-500">
                            {ws.type} · {ws.status || 'Active'}
                          </span>
                        </div>
                        {onOpenWorkspace && (
                          <button
                            type="button"
                            onClick={() => onOpenWorkspace(ws.id)}
                            className="inline-flex items-center gap-1 text-[11px] text-[#FF1E1E] hover:underline shrink-0"
                          >
                            <span>Open</span>
                            <ArrowUpRight size={11} />
                          </button>
                        )}
                      </li>
                    ))}
                  </ul>
                )}

                <div className="border border-[#242424] bg-[#101010] p-3 text-[11px] text-neutral-400 flex items-start gap-2">
                  <Info size={14} className="text-neutral-500 shrink-0 mt-0.5" />
                  <span>
                    Deactivating hides this package from public Services/Pricing and new workspace
                    selections while preserving all existing workspace contracts and release/project
                    history. Permanent deletion is omitted here to protect historical references.
                  </span>
                </div>
              </div>

              {/* Catalog Audit History */}
              <div className="p-5 space-y-2.5">
                <h4 className="text-[10px] font-mono uppercase tracking-widest text-neutral-500 flex items-center gap-1.5">
                  <History size={12} />
                  <span>Catalog Audit History</span>
                </h4>
                {auditLoading ? (
                  <p className="text-xs text-neutral-500">Loading catalog audit records…</p>
                ) : auditError ? (
                  <p className="text-xs text-red-300">{auditError}</p>
                ) : auditLogs.length === 0 ? (
                  <p className="text-xs text-neutral-500">
                    No administrative audit entries recorded for this package yet.
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

      {/* Create / Edit Service Package Modal (adminSaveServicePackage) */}
      <Modal
        isOpen={editorOpen}
        onClose={() => {
          if (!editorSaving) {
            setEditorOpen(false);
            setEditingPackage(null);
            setEditorConfirmStep(false);
            setEditorError('');
          }
        }}
        maxWidth="lg"
        title={editingPackage ? 'Edit Service Package' : 'Create Service Package'}
        subtitle={
          editingPackage
            ? `${editingPackage.id} · Preserves existing workspace contracts`
            : 'Saved via adminSaveServicePackage to Firestore services collection'
        }
      >
        <form onSubmit={e => void handleEditorSubmit(e)} className="space-y-4 text-xs">
          {editorError && (
            <p
              role="alert"
              className="rounded border border-red-500/30 bg-red-950/20 p-3 text-xs text-red-300"
            >
              {editorError}
            </p>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="svc-name"
                className="mb-1 block text-[10px] font-mono uppercase text-neutral-500"
              >
                Service / Package Name *
              </label>
              <input
                id="svc-name"
                required
                maxLength={120}
                value={formName}
                onChange={e => {
                  setFormName(e.target.value);
                  setEditorConfirmStep(false);
                }}
                placeholder="e.g. Single Release Launch Package"
                className="w-full rounded border border-[#333] bg-[#141414] px-3 py-2 text-white focus:border-[#FF1E1E] focus:outline-none"
              />
            </div>

            <div>
              <label
                htmlFor="svc-id"
                className="mb-1 block text-[10px] font-mono uppercase text-neutral-500"
              >
                {editingPackage ? 'Catalog ID (Locked)' : 'Catalog ID (Optional slug)'}
              </label>
              <input
                id="svc-id"
                disabled={Boolean(editingPackage)}
                maxLength={128}
                value={editingPackage ? editingPackage.id : formId}
                onChange={e => setFormId(e.target.value)}
                placeholder="Auto-generated from name if blank"
                className="w-full rounded border border-[#333] bg-[#141414] px-3 py-2 font-mono text-white focus:border-[#FF1E1E] focus:outline-none disabled:opacity-60"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="svc-category"
                className="mb-1 block text-[10px] font-mono uppercase text-neutral-500"
              >
                Category *
              </label>
              <select
                id="svc-category"
                value={formCategory}
                onChange={e => {
                  setFormCategory(e.target.value as ServiceCategory);
                  setEditorConfirmStep(false);
                }}
                className="w-full rounded border border-[#333] bg-[#141414] px-3 py-2 text-white focus:border-[#FF1E1E] focus:outline-none"
              >
                {SERVICE_CATEGORIES.map(category => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="svc-tier"
                className="mb-1 block text-[10px] font-mono uppercase text-neutral-500"
              >
                Package Tier *
              </label>
              <select
                id="svc-tier"
                value={formTier}
                onChange={e => {
                  setFormTier(e.target.value as ServiceTier);
                  setEditorConfirmStep(false);
                }}
                className="w-full rounded border border-[#333] bg-[#141414] px-3 py-2 text-white focus:border-[#FF1E1E] focus:outline-none"
              >
                {SERVICE_TIERS.map(tier => (
                  <option key={tier} value={tier}>
                    {tier}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="svc-price"
                className="mb-1 block text-[10px] font-mono uppercase text-neutral-500"
              >
                Price (USD) *
              </label>
              <input
                id="svc-price"
                type="number"
                min={0}
                max={10000000}
                step="1"
                required
                value={formPriceUsd}
                onChange={e => {
                  setFormPriceUsd(e.target.value);
                  setEditorConfirmStep(false);
                }}
                className="w-full rounded border border-[#333] bg-[#141414] px-3 py-2 font-mono text-white focus:border-[#FF1E1E] focus:outline-none"
              />
            </div>

            <div>
              <label
                htmlFor="svc-billing"
                className="mb-1 block text-[10px] font-mono uppercase text-neutral-500"
              >
                Billing Model *
              </label>
              <select
                id="svc-billing"
                value={formBillingType}
                onChange={e => {
                  setFormBillingType(e.target.value as ServicePackage['billingType']);
                  setEditorConfirmStep(false);
                }}
                className="w-full rounded border border-[#333] bg-[#141414] px-3 py-2 text-white focus:border-[#FF1E1E] focus:outline-none"
              >
                {BILLING_TYPES.map(billing => (
                  <option key={billing} value={billing}>
                    {billing}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label
                htmlFor="svc-turnaround"
                className="mb-1 block text-[10px] font-mono uppercase text-neutral-500"
              >
                Turnaround (Days) *
              </label>
              <input
                id="svc-turnaround"
                type="number"
                min={1}
                max={365}
                required
                value={formTurnaroundDays}
                onChange={e => {
                  setFormTurnaroundDays(e.target.value);
                  setEditorConfirmStep(false);
                }}
                className="w-full rounded border border-[#333] bg-[#141414] px-3 py-2 font-mono text-white focus:border-[#FF1E1E] focus:outline-none"
              />
            </div>

            <div>
              <label
                htmlFor="svc-revisions"
                className="mb-1 block text-[10px] font-mono uppercase text-neutral-500"
              >
                Revisions (-1 = Unltd) *
              </label>
              <input
                id="svc-revisions"
                type="number"
                min={-1}
                max={100}
                required
                value={formRevisionLimit}
                onChange={e => {
                  setFormRevisionLimit(e.target.value);
                  setEditorConfirmStep(false);
                }}
                className="w-full rounded border border-[#333] bg-[#141414] px-3 py-2 font-mono text-white focus:border-[#FF1E1E] focus:outline-none"
              />
            </div>

            <div>
              <label
                htmlFor="svc-audience"
                className="mb-1 block text-[10px] font-mono uppercase text-neutral-500"
              >
                Target Audience *
              </label>
              <select
                id="svc-audience"
                value={formTargetAudience}
                onChange={e => {
                  setFormTargetAudience(e.target.value as ServicePackage['targetAudience']);
                  setEditorConfirmStep(false);
                }}
                className="w-full rounded border border-[#333] bg-[#141414] px-3 py-2 text-white focus:border-[#FF1E1E] focus:outline-none"
              >
                {TARGET_AUDIENCES.map(aud => (
                  <option key={aud} value={aud}>
                    {aud}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label
              htmlFor="svc-description"
              className="mb-1 block text-[10px] font-mono uppercase text-neutral-500"
            >
              Description (max 2,000 chars)
            </label>
            <textarea
              id="svc-description"
              rows={2}
              maxLength={2000}
              value={formDescription}
              onChange={e => {
                setFormDescription(e.target.value);
                setEditorConfirmStep(false);
              }}
              placeholder="Scope and creative positioning shown on Services & Pricing..."
              className="w-full rounded border border-[#333] bg-[#141414] px-3 py-2 text-white focus:border-[#FF1E1E] focus:outline-none"
            />
          </div>

          <div>
            <label
              htmlFor="svc-deliverables"
              className="mb-1 block text-[10px] font-mono uppercase text-neutral-500"
            >
              Included Deliverables (One per line, max 50 items)
            </label>
            <textarea
              id="svc-deliverables"
              rows={4}
              value={formDeliverablesText}
              onChange={e => {
                setFormDeliverablesText(e.target.value);
                setEditorConfirmStep(false);
              }}
              placeholder="3000x3000px Master Cover Artwork&#10;Spotify 9:16 Seamless Canvas&#10;Electronic Press Kit PDF"
              className="w-full rounded border border-[#333] bg-[#141414] px-3 py-2 font-mono text-[11px] text-white focus:border-[#FF1E1E] focus:outline-none"
            />
          </div>

          {!editingPackage && (
            <label className="flex items-center gap-2 text-neutral-300 cursor-pointer">
              <input
                type="checkbox"
                checked={formIsActive}
                onChange={e => setFormIsActive(e.target.checked)}
                className="accent-[#FF1E1E]"
              />
              <span>Publish immediately as Active on public Services &amp; Pricing pages</span>
            </label>
          )}

          {editingPackage && editorConfirmStep && (
            <div className="rounded border border-amber-800/50 bg-amber-950/20 p-3 text-xs text-amber-200 leading-relaxed">
              Confirm saving updates to <strong>{formName.trim()}</strong>?{' '}
              {editingPackage.isActive
                ? 'Because this package is Active, public Services and Pricing pages will reflect these updates immediately. '
                : ''}
              Existing workspace <code className="font-mono">contractedPackageIds</code> references
              will be preserved.
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2 border-t border-[#1F1F1F]">
            {editingPackage && editorConfirmStep ? (
              <>
                <button
                  type="button"
                  disabled={editorSaving}
                  onClick={() => setEditorConfirmStep(false)}
                  className="rounded border border-[#333] px-4 py-2 text-xs text-neutral-300 hover:text-white disabled:opacity-50"
                >
                  Back to Edit
                </button>
                <button
                  type="submit"
                  disabled={editorSaving}
                  className="rounded bg-[#FF1E1E] px-4 py-2 text-xs font-semibold text-white disabled:opacity-50"
                >
                  {editorSaving ? 'Saving…' : 'Confirm Save'}
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  disabled={editorSaving}
                  onClick={() => {
                    setEditorOpen(false);
                    setEditingPackage(null);
                    setEditorConfirmStep(false);
                    setEditorError('');
                  }}
                  className="rounded border border-[#333] px-4 py-2 text-xs text-neutral-300 hover:text-white disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editorSaving}
                  className="rounded bg-[#FF1E1E] px-4 py-2 text-xs font-semibold text-white disabled:opacity-50"
                >
                  {editorSaving
                    ? 'Saving…'
                    : editingPackage
                      ? 'Review & Save'
                      : 'Create Package'}
                </button>
              </>
            )}
          </div>
        </form>
      </Modal>

      {/* Activate / Deactivate Confirmation Modal (adminSetServicePackageActive) */}
      <Modal
        isOpen={Boolean(activeToggleTarget)}
        onClose={() => {
          if (!toggleSaving) {
            setActiveToggleTarget(null);
            setToggleError('');
          }
        }}
        maxWidth="md"
        title={
          activeToggleTarget?.nextIsActive
            ? 'Activate Service Package'
            : 'Deactivate Service Package'
        }
        subtitle={activeToggleTarget?.pkg.name}
      >
        {activeToggleTarget && (
          <div className="space-y-4">
            {toggleError && (
              <p
                role="alert"
                className="rounded border border-red-500/30 bg-red-950/20 p-3 text-xs text-red-300"
              >
                {toggleError}
              </p>
            )}
            <p className="text-sm text-neutral-300 leading-relaxed">
              {activeToggleTarget.nextIsActive ? (
                <>
                  Activate <strong>{activeToggleTarget.pkg.name}</strong>? It will appear on the
                  public Services and Pricing pages and become available for new workspace
                  contract assignments.
                </>
              ) : (
                <>
                  Deactivate <strong>{activeToggleTarget.pkg.name}</strong>? It will be removed from
                  the public Services and Pricing pages and hidden from new package selection.
                </>
              )}
            </p>
            {!activeToggleTarget.nextIsActive && activeToggleTarget.contractedCount > 0 && (
              <p className="rounded border border-[#2A2A2A] bg-[#121212] p-3 text-xs text-neutral-300 leading-relaxed">
                <strong>{activeToggleTarget.contractedCount}</strong> workspace
                {activeToggleTarget.contractedCount === 1 ? ' currently contracts' : 's currently contract'}{' '}
                this package. Deactivation will NOT cancel existing client agreements or alter their{' '}
                <code className="font-mono">contractedPackageIds</code> references.
              </p>
            )}
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                disabled={toggleSaving}
                onClick={() => {
                  setActiveToggleTarget(null);
                  setToggleError('');
                }}
                className="rounded border border-[#333] px-4 py-2 text-xs text-neutral-300 hover:text-white disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={toggleSaving}
                onClick={() => void confirmToggleActive()}
                className="rounded bg-[#FF1E1E] px-4 py-2 text-xs font-semibold text-white disabled:opacity-50"
              >
                {toggleSaving
                  ? 'Updating…'
                  : activeToggleTarget.nextIsActive
                    ? 'Activate Package'
                    : 'Deactivate Package'}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ServicesPackagesManagement;
