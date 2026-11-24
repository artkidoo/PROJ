/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * KEEDOHUB — Artist Department Releases Console
 */

import React, { useEffect, useMemo, useState } from 'react';
import {
  collection,
  onSnapshot,
  type Unsubscribe,
} from 'firebase/firestore';
import {
  ArrowUpRight,
  Calendar,
  CheckCircle2,
  Disc3,
  FolderKanban,
  Music,
  Search,
  ShieldAlert,
} from 'lucide-react';
import { db } from '../../lib/firebase';
import { useApp } from '../../context/AppContext';
import { resolveWorkspaceDepartment } from '../../lib/adminHQNavigation';
import type {
  ClientProject,
  DistributionStatus,
  MusicRelease,
  Workspace,
} from '../../types';

interface AdminArtistReleasesPanelProps {
  onOpenWorkspace?: (workspaceId: string) => void;
  onOpenProject?: (projectId: string) => void;
}

interface WorkspaceReleaseEntry {
  workspace: Workspace;
  release: MusicRelease;
}

const RELEASE_STATUS_FILTERS: readonly ('All' | DistributionStatus)[] = [
  'All',
  'Planning',
  'In Production',
  'Metadata Verification',
  'Scheduled',
  'Delivered',
  'Live',
];

function computeChecklistCompletion(release: MusicRelease): { done: number; total: number; pct: number } {
  const checklist = release.checklist;
  if (!checklist) return { done: 0, total: 7, pct: 0 };
  const flags = [
    checklist.audioMastered,
    checklist.artworkApproved,
    checklist.splitSheetSigned,
    checklist.metadataVerified,
    checklist.distributionSubmitted,
    checklist.pressKitReady,
    checklist.marketingAssetsReady,
  ];
  const done = flags.filter(Boolean).length;
  return {
    done,
    total: flags.length,
    pct: Math.round((done / flags.length) * 100),
  };
}

function statusBadgeStyle(status?: DistributionStatus): string {
  switch (status) {
    case 'Live':
    case 'Delivered':
      return 'border-emerald-800/60 bg-emerald-950/30 text-emerald-300';
    case 'Scheduled':
      return 'border-blue-800/60 bg-blue-950/30 text-blue-300';
    case 'Metadata Verification':
      return 'border-amber-800/60 bg-amber-950/30 text-amber-300';
    case 'In Production':
      return 'border-indigo-800/60 bg-indigo-950/30 text-indigo-300';
    default:
      return 'border-neutral-700 bg-[#141414] text-neutral-300';
  }
}

export const AdminArtistReleasesPanel: React.FC<AdminArtistReleasesPanelProps> = ({
  onOpenWorkspace,
  onOpenProject,
}) => {
  const { firebaseUser, canAccessAdminCenter } = useApp();

  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [projects, setProjects] = useState<ClientProject[]>([]);
  const [releasesByWorkspace, setReleasesByWorkspace] = useState<Record<string, MusicRelease[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | DistributionStatus>('All');
  const [selectedWorkspaceFilter, setSelectedWorkspaceFilter] = useState<string>('All');

  useEffect(() => {
    if (!firebaseUser || !canAccessAdminCenter) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');

    const unsubWorkspaces = onSnapshot(
      collection(db, 'workspaces'),
      snapshot => {
        const list = snapshot.docs.map(d => ({ ...(d.data() as Workspace), id: d.id }));
        setWorkspaces(list);
        setLoading(false);
      },
      err => {
        setError(err?.message || 'Unable to load artist workspaces.');
        setLoading(false);
      },
    );

    const unsubProjects = onSnapshot(
      collection(db, 'clientProjects'),
      snapshot => {
        setProjects(snapshot.docs.map(d => ({ ...(d.data() as ClientProject), id: d.id })));
      },
      () => {},
    );

    return () => {
      unsubWorkspaces();
      unsubProjects();
    };
  }, [firebaseUser, canAccessAdminCenter]);

  const artistWorkspaces = useMemo(
    () =>
      workspaces
        .filter(ws => resolveWorkspaceDepartment(ws) === 'Artist')
        .sort((a, b) => (a.name || '').localeCompare(b.name || '')),
    [workspaces],
  );

  // Per-workspace releases subscription (strictly compliant with /workspaces/{workspaceId}/releases/{releaseId} rules)
  useEffect(() => {
    if (!firebaseUser || !canAccessAdminCenter || artistWorkspaces.length === 0) {
      setReleasesByWorkspace({});
      return;
    }

    const activeIds = new Set(artistWorkspaces.map(w => w.id));
    setReleasesByWorkspace(prev => {
      const next: Record<string, MusicRelease[]> = {};
      for (const id of Object.keys(prev)) {
        if (activeIds.has(id)) next[id] = prev[id];
      }
      return next;
    });

    const unsubs: Unsubscribe[] = artistWorkspaces.map(ws =>
      onSnapshot(
        collection(db, 'workspaces', ws.id, 'releases'),
        snapshot => {
          const items = snapshot.docs.map(d => ({
            ...(d.data() as MusicRelease),
            id: d.id,
            workspaceId: ws.id,
          }));
          setReleasesByWorkspace(prev => ({ ...prev, [ws.id]: items }));
        },
        () => {
          setReleasesByWorkspace(prev => ({ ...prev, [ws.id]: prev[ws.id] || [] }));
        },
      ),
    );

    return () => {
      unsubs.forEach(u => u());
    };
  }, [artistWorkspaces, firebaseUser, canAccessAdminCenter]);

  const projectsById = useMemo(() => {
    const map = new Map<string, ClientProject>();
    projects.forEach(p => map.set(p.id, p));
    return map;
  }, [projects]);

  const allEntries = useMemo<WorkspaceReleaseEntry[]>(() => {
    const workspaceById = new Map(artistWorkspaces.map(w => [w.id, w]));
    const rows: WorkspaceReleaseEntry[] = [];
    for (const [wsId, list] of Object.entries(releasesByWorkspace)) {
      const ws = workspaceById.get(wsId);
      if (!ws) continue;
      for (const rel of list) {
        rows.push({ workspace: ws, release: rel });
      }
    }
    return rows.sort((a, b) =>
      (b.release.plannedReleaseDate || b.release.createdAt || '').localeCompare(
        a.release.plannedReleaseDate || a.release.createdAt || '',
      ),
    );
  }, [artistWorkspaces, releasesByWorkspace]);

  const filteredEntries = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return allEntries.filter(({ workspace, release }) => {
      if (selectedWorkspaceFilter !== 'All' && workspace.id !== selectedWorkspaceFilter) {
        return false;
      }
      if (statusFilter !== 'All' && release.distributionStatus !== statusFilter) {
        return false;
      }
      if (!q) return true;
      return (
        (release.title || '').toLowerCase().includes(q) ||
        (release.artistName || '').toLowerCase().includes(q) ||
        (workspace.name || '').toLowerCase().includes(q) ||
        (release.isrc || '').toLowerCase().includes(q) ||
        (release.upc || '').toLowerCase().includes(q) ||
        (release.type || '').toLowerCase().includes(q)
      );
    });
  }, [allEntries, searchQuery, selectedWorkspaceFilter, statusFilter]);

  const metrics = useMemo(() => {
    const total = allEntries.length;
    const inProduction = allEntries.filter(
      e =>
        e.release.distributionStatus === 'Planning' ||
        e.release.distributionStatus === 'In Production',
    ).length;
    const verificationOrScheduled = allEntries.filter(
      e =>
        e.release.distributionStatus === 'Metadata Verification' ||
        e.release.distributionStatus === 'Scheduled',
    ).length;
    const deliveredOrLive = allEntries.filter(
      e =>
        e.release.distributionStatus === 'Delivered' ||
        e.release.distributionStatus === 'Live',
    ).length;

    return { total, inProduction, verificationOrScheduled, deliveredOrLive };
  }, [allEntries]);

  if (!firebaseUser || !canAccessAdminCenter) {
    return (
      <div className="border border-red-900/50 bg-[#0C0C0C] p-6 text-xs text-red-300 flex items-center gap-3">
        <ShieldAlert size={16} className="text-[#FF1E1E]" />
        <span>Authorized platform administrator access is required.</span>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {error && (
        <div role="alert" className="border border-red-900/50 bg-red-950/20 px-4 py-3 text-xs text-red-200">
          {error}
        </div>
      )}

      {/* Release Metrics Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="border border-[#1E1E1E] bg-[#0C0C0C] p-4">
          <div className="flex items-center justify-between text-neutral-400">
            <span className="text-[11px] font-mono uppercase tracking-wider">Artist Releases</span>
            <Disc3 size={15} className="text-[#FF1E1E]" />
          </div>
          <p className="mt-2 text-2xl font-bold font-mono tabular-nums text-white">{metrics.total}</p>
          <p className="mt-1 text-xs text-neutral-500">Across {artistWorkspaces.length} artist workspaces</p>
        </div>

        <div className="border border-[#1E1E1E] bg-[#0C0C0C] p-4">
          <div className="flex items-center justify-between text-neutral-400">
            <span className="text-[11px] font-mono uppercase tracking-wider">Planning &amp; Studio</span>
            <Music size={15} className="text-indigo-400" />
          </div>
          <p className="mt-2 text-2xl font-bold font-mono tabular-nums text-white">{metrics.inProduction}</p>
          <p className="mt-1 text-xs text-neutral-500">Masters, artwork &amp; split sheets in progress</p>
        </div>

        <div className="border border-[#1E1E1E] bg-[#0C0C0C] p-4">
          <div className="flex items-center justify-between text-neutral-400">
            <span className="text-[11px] font-mono uppercase tracking-wider">QA &amp; Scheduled</span>
            <Calendar size={15} className="text-amber-400" />
          </div>
          <p className="mt-2 text-2xl font-bold font-mono tabular-nums text-white">{metrics.verificationOrScheduled}</p>
          <p className="mt-1 text-xs text-neutral-500">Metadata verification or queued for DSPs</p>
        </div>

        <div className="border border-[#1E1E1E] bg-[#0C0C0C] p-4">
          <div className="flex items-center justify-between text-neutral-400">
            <span className="text-[11px] font-mono uppercase tracking-wider">Delivered &amp; Live</span>
            <CheckCircle2 size={15} className="text-emerald-400" />
          </div>
          <p className="mt-2 text-2xl font-bold font-mono tabular-nums text-white">{metrics.deliveredOrLive}</p>
          <p className="mt-1 text-xs text-neutral-500">Distributed &amp; active catalog releases</p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="border border-[#1E1E1E] bg-[#0C0C0C] p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search release title, artist, workspace, ISRC, or UPC..."
            className="w-full bg-[#121212] border border-[#242424] pl-9 pr-3 py-2 text-xs text-white placeholder:text-neutral-500 focus:outline-none focus:border-[#FF1E1E]"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            aria-label="Filter by artist workspace"
            value={selectedWorkspaceFilter}
            onChange={e => setSelectedWorkspaceFilter(e.target.value)}
            className="bg-[#121212] border border-[#242424] px-3 py-2 text-xs text-white focus:outline-none focus:border-[#FF1E1E]"
          >
            <option value="All">All Artist Workspaces ({artistWorkspaces.length})</option>
            {artistWorkspaces.map(ws => (
              <option key={ws.id} value={ws.id}>
                {ws.name}
              </option>
            ))}
          </select>

          <select
            aria-label="Filter by distribution status"
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value as 'All' | DistributionStatus)}
            className="bg-[#121212] border border-[#242424] px-3 py-2 text-xs text-white focus:outline-none focus:border-[#FF1E1E]"
          >
            {RELEASE_STATUS_FILTERS.map(status => (
              <option key={status} value={status}>
                {status === 'All' ? 'All Distribution Stages' : status}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Releases Catalog Table */}
      <div className="border border-[#1E1E1E] bg-[#0C0C0C]">
        {loading ? (
          <div className="p-6 space-y-2.5">
            <div className="h-10 bg-[#141414]" />
            <div className="h-10 bg-[#141414]" />
            <div className="h-10 bg-[#141414]" />
          </div>
        ) : filteredEntries.length === 0 ? (
          <div className="p-8 text-center space-y-2">
            <Disc3 size={24} className="mx-auto text-neutral-600" />
            <p className="text-sm font-semibold text-white">
              {allEntries.length === 0
                ? 'No artist music releases recorded yet'
                : 'No releases match the active filters'}
            </p>
            <p className="text-xs text-neutral-500 max-w-md mx-auto">
              Releases created inside Artist workspaces under `/workspaces/{'{workspaceId}'}/releases` appear here automatically for release readiness &amp; distribution oversight.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#111111] border-b border-[#1E1E1E] text-neutral-400 font-mono uppercase text-[10px]">
                <tr>
                  <th className="py-3 px-4 font-normal">Release</th>
                  <th className="py-3 px-4 font-normal">Artist &amp; Workspace</th>
                  <th className="py-3 px-4 font-normal">Format</th>
                  <th className="py-3 px-4 font-normal">Target Date</th>
                  <th className="py-3 px-4 font-normal">Stage</th>
                  <th className="py-3 px-4 font-normal">ISRC / UPC</th>
                  <th className="py-3 px-4 font-normal">Readiness</th>
                  <th className="py-3 px-4 font-normal text-right">Links</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#171717]">
                {filteredEntries.map(({ workspace, release }) => {
                  const readiness = computeChecklistCompletion(release);
                  const linkedProject = release.associatedProductionProjectId
                    ? projectsById.get(release.associatedProductionProjectId)
                    : undefined;

                  return (
                    <tr
                      key={`${workspace.id}-${release.id}`}
                      className="hover:bg-[#121212] transition-colors"
                    >
                      <td className="py-3 px-4">
                        <p className="font-semibold text-white">{release.title}</p>
                        {release.featuredArtists ? (
                          <p className="text-[11px] text-neutral-400 truncate max-w-[220px]">
                            feat. {release.featuredArtists}
                          </p>
                        ) : null}
                      </td>
                      <td className="py-3 px-4">
                        <p className="text-neutral-200">{release.artistName || workspace.name}</p>
                        <p className="text-[11px] font-mono text-neutral-500 truncate max-w-[180px]">
                          {workspace.name}
                        </p>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap font-mono text-neutral-300">
                        {release.type}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap font-mono tabular-nums text-neutral-300">
                        {release.plannedReleaseDate || '—'}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span
                          className={`inline-block border px-2 py-0.5 text-[10px] font-mono uppercase ${statusBadgeStyle(
                            release.distributionStatus,
                          )}`}
                        >
                          {release.distributionStatus || 'Planning'}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono text-[11px] text-neutral-400 whitespace-nowrap">
                        <div>{release.isrc || 'No ISRC'}</div>
                        <div className="text-neutral-600">{release.upc || 'No UPC'}</div>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-1.5 bg-[#1E1E1E] overflow-hidden">
                            <div
                              className="h-full bg-[#FF1E1E]"
                              style={{ width: `${readiness.pct}%` }}
                            />
                          </div>
                          <span className="font-mono tabular-nums text-[11px] text-neutral-300">
                            {readiness.done}/{readiness.total}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5">
                          {onOpenWorkspace && (
                            <button
                              type="button"
                              onClick={() => onOpenWorkspace(workspace.id)}
                              className="inline-flex items-center gap-1 border border-[#282828] bg-[#141414] hover:border-white px-2.5 py-1 text-[11px] text-neutral-200"
                            >
                              <span>Workspace</span>
                              <ArrowUpRight size={11} />
                            </button>
                          )}
                          {linkedProject && onOpenProject && (
                            <button
                              type="button"
                              onClick={() => onOpenProject(linkedProject.id)}
                              className="inline-flex items-center gap-1 border border-[#282828] bg-[#141414] hover:border-[#FF1E1E] px-2.5 py-1 text-[11px] text-white"
                            >
                              <FolderKanban size={11} className="text-[#FF1E1E]" />
                              <span>Project</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminArtistReleasesPanel;
