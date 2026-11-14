/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * KEEDOHUB — Audit History Management
 */

import React, { useState, useEffect, useMemo } from 'react';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { History, Search, Filter, ShieldCheck, Clock, User } from 'lucide-react';

interface AuditLogEntry {
  id: string;
  actorUid?: string;
  actorName?: string;
  action: string;
  target?: string;
  targetUid?: string;
  details?: string;
  createdAt: string;
}

export const AuditHistoryManagement: React.FC = () => {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [actionFilter, setActionFilter] = useState('All');

  useEffect(() => {
    const q = query(collection(db, 'adminAuditLogs'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, snapshot => {
      const records = snapshot.docs.map(doc => ({
        id: doc.id,
        ...(doc.data() as Omit<AuditLogEntry, 'id'>),
      }));
      setLogs(records);
      setLoading(false);
    }, err => {
      setError(err?.message || 'Unable to load audit history.');
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const actionTypes = useMemo(() => {
    const set = new Set<string>();
    logs.forEach(l => { if (l.action) set.add(l.action); });
    return ['All', ...Array.from(set)];
  }, [logs]);

  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      const matchesAction = actionFilter === 'All' || log.action === actionFilter;
      const q = searchQuery.toLowerCase().trim();
      const matchesQuery = !q ||
        (log.actorName && log.actorName.toLowerCase().includes(q)) ||
        (log.actorUid && log.actorUid.toLowerCase().includes(q)) ||
        (log.target && log.target.toLowerCase().includes(q)) ||
        (log.action && log.action.toLowerCase().includes(q)) ||
        (log.details && log.details.toLowerCase().includes(q));
      return matchesAction && matchesQuery;
    });
  }, [logs, actionFilter, searchQuery]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#1E1E1E] pb-5">
        <div>
          <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-[#FF1E1E]">Platform Security</p>
          <h2 className="mt-1 text-2xl font-bold text-white">Administrative Audit History</h2>
          <p className="mt-1 text-sm text-neutral-400">Server-recorded immutable audit trail across administrator role changes, client status updates, and workspace operations.</p>
        </div>
      </div>

      {error && <div role="alert" className="rounded border border-red-500/30 bg-red-950/30 p-3 text-sm text-red-300">{error}</div>}

      <section className="rounded-xl border border-[#222] bg-[#0D0D0D] p-5 sm:p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <h3 className="text-base font-bold text-white">Audit Records ({filteredLogs.length})</h3>
            <select
              value={actionFilter}
              onChange={e => setActionFilter(e.target.value)}
              className="rounded border border-[#303030] bg-[#141414] px-3 py-1.5 text-xs text-white outline-none focus:border-[#FF1E1E]"
            >
              {actionTypes.map(act => (
                <option key={act} value={act}>{act === 'All' ? 'All Action Types' : act}</option>
              ))}
            </select>
          </div>
          <div className="relative w-full sm:w-64">
            <Search size={14} className="absolute left-3 top-3 text-neutral-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search audit trail..."
              className="w-full rounded border border-[#303030] bg-[#141414] py-2 pl-9 pr-3 text-xs text-white placeholder-neutral-500 outline-none focus:border-[#FF1E1E]"
            />
          </div>
        </div>

        {loading ? (
          <p className="py-12 text-center text-sm text-neutral-500">Loading audit history…</p>
        ) : filteredLogs.length === 0 ? (
          <p className="py-12 text-center text-sm text-neutral-500">No audit records match your search.</p>
        ) : (
          <div className="overflow-x-auto border border-[#1A1A1A] rounded-lg">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#141414] text-neutral-500 uppercase tracking-widest text-[10px]">
                <tr>
                  <th className="px-4 py-3">Timestamp</th>
                  <th className="px-4 py-3">Actor</th>
                  <th className="px-4 py-3">Action</th>
                  <th className="px-4 py-3">Target / Record</th>
                  <th className="px-4 py-3">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1A1A1A]">
                {filteredLogs.map(log => (
                  <tr key={log.id} className="hover:bg-[#121212] transition-colors">
                    <td className="px-4 py-3 text-neutral-400 whitespace-nowrap">{log.createdAt ? new Date(log.createdAt).toLocaleString() : '—'}</td>
                    <td className="px-4 py-3 text-white font-semibold">
                      {log.actorName || log.actorUid || 'System'}
                      {log.actorUid && <span className="block text-[10px] font-mono text-neutral-500">{log.actorUid}</span>}
                    </td>
                    <td className="px-4 py-3">
                      <span className="rounded bg-neutral-900 border border-neutral-800 px-2 py-0.5 text-[10px] font-mono text-neutral-300">
                        {log.action}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-neutral-300 font-mono">{log.target || log.targetUid || '—'}</td>
                    <td className="px-4 py-3 text-neutral-400 max-w-xs truncate">{log.details || '—'}</td>
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
