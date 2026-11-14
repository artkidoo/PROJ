/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * KEEDOHUB — Administrator Management
 */

import React, { useState, useEffect, useMemo } from 'react';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { db, functions } from '../../lib/firebase';
import { ShieldCheck, UserPlus, ShieldAlert, Trash2, Search, Lock, CheckCircle2, AlertTriangle, RefreshCw } from 'lucide-react';

interface AdminRecord {
  uid: string;
  role?: string;
  status?: string;
  grantedAt?: string;
  grantedBy?: string;
}

export const AdminManagement: React.FC = () => {
  const [admins, setAdmins] = useState<AdminRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [targetUidInput, setTargetUidInput] = useState('');
  const [actionSubmitting, setActionSubmitting] = useState(false);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'admins'), snapshot => {
      const records = snapshot.docs.map(doc => ({
        uid: doc.id,
        ...(doc.data() as Omit<AdminRecord, 'uid'>),
      }));
      setAdmins(records);
      setLoading(false);
    }, err => {
      setError(err?.message || 'Unable to load administrator records.');
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const handleGrantAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetUid = targetUidInput.trim();
    if (!targetUid) return;
    setActionSubmitting(true);
    setError('');
    setSuccessMessage('');
    try {
      const fn = httpsCallable(functions, 'adminUpdatePlatformRole');
      await fn({ targetUid, action: 'grant' });
      setSuccessMessage(`Successfully granted platform administrator access to ${targetUid}.`);
      setTargetUidInput('');
    } catch (err: any) {
      setError(err?.message || 'Failed to grant administrator access.');
    } finally {
      setActionSubmitting(false);
    }
  };

  const handleRevokeAdmin = async (targetUid: string) => {
    if (!window.confirm(`Are you sure you want to revoke administrator access for ${targetUid}?`)) return;
    setActionSubmitting(true);
    setError('');
    setSuccessMessage('');
    try {
      const fn = httpsCallable(functions, 'adminUpdatePlatformRole');
      await fn({ targetUid, action: 'revoke' });
      setSuccessMessage(`Successfully revoked administrator access for ${targetUid}.`);
    } catch (err: any) {
      setError(err?.message || 'Failed to revoke administrator access.');
    } finally {
      setActionSubmitting(false);
    }
  };

  const filteredAdmins = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return admins;
    return admins.filter(a =>
      a.uid.toLowerCase().includes(q) ||
      (a.role && a.role.toLowerCase().includes(q)) ||
      (a.status && a.status.toLowerCase().includes(q))
    );
  }, [admins, searchQuery]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#1E1E1E] pb-5">
        <div>
          <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-[#FF1E1E]">Platform Security</p>
          <h2 className="mt-1 text-2xl font-bold text-white">Administrator Management</h2>
          <p className="mt-1 text-sm text-neutral-400">Control privileged platform roles, grant authorized operators, and enforce last-administrator safeguards.</p>
        </div>
      </div>

      {error && <div role="alert" className="rounded border border-red-500/30 bg-red-950/30 p-3 text-sm text-red-300">{error}</div>}
      {successMessage && <div role="status" className="rounded border border-emerald-500/30 bg-emerald-950/20 p-3 text-sm text-emerald-300">{successMessage}</div>}

      <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
        {/* Admin List */}
        <section className="rounded-xl border border-[#222] bg-[#0D0D0D] p-5 sm:p-6 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="text-base font-bold text-white">Active Administrators ({filteredAdmins.length})</h3>
            <div className="relative w-full sm:w-64">
              <Search size={14} className="absolute left-3 top-3 text-neutral-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search by UID or role..."
                className="w-full rounded border border-[#303030] bg-[#141414] py-2 pl-9 pr-3 text-xs text-white placeholder-neutral-500 outline-none focus:border-[#FF1E1E]"
              />
            </div>
          </div>

          {loading ? (
            <p className="py-12 text-center text-sm text-neutral-500">Loading administrators…</p>
          ) : filteredAdmins.length === 0 ? (
            <p className="py-12 text-center text-sm text-neutral-500">No administrator records found.</p>
          ) : (
            <div className="overflow-x-auto border border-[#1A1A1A] rounded-lg">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#141414] text-neutral-500 uppercase tracking-widest text-[10px]">
                  <tr>
                    <th className="px-4 py-3">Administrator UID</th>
                    <th className="px-4 py-3">Role</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Granted</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1A1A1A]">
                  {filteredAdmins.map(admin => (
                    <tr key={admin.uid} className="hover:bg-[#121212] transition-colors">
                      <td className="px-4 py-3 font-mono text-white">{admin.uid}</td>
                      <td className="px-4 py-3 text-neutral-300 font-semibold">{admin.role || 'Platform Admin'}</td>
                      <td className="px-4 py-3">
                        <span className="rounded bg-emerald-950/60 border border-emerald-500/30 px-2 py-0.5 text-[10px] text-emerald-300 font-semibold uppercase">
                          {admin.status || 'Active'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-neutral-400">{admin.grantedAt ? new Date(admin.grantedAt).toLocaleDateString() : '—'}</td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => void handleRevokeAdmin(admin.uid)}
                          disabled={actionSubmitting}
                          className="rounded border border-red-500/30 bg-red-950/20 px-2.5 py-1 text-[11px] font-semibold text-red-300 hover:bg-red-950/50 disabled:opacity-50"
                        >
                          Revoke
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Grant Admin Form */}
        <aside className="rounded-xl border border-[#222] bg-[#0D0D0D] p-5 sm:p-6 h-fit space-y-4">
          <div className="flex items-center gap-2 text-white">
            <UserPlus size={18} className="text-[#FF1E1E]" />
            <h3 className="text-base font-bold">Grant Admin Access</h3>
          </div>
          <p className="text-xs text-neutral-400 leading-relaxed">
            Enter the exact Firebase Auth UID of the user you want to authorize as a platform administrator. Protected backend functions verify the account and log the action.
          </p>

          <form onSubmit={handleGrantAdmin} className="space-y-3">
            <div>
              <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-neutral-500">Firebase User UID</label>
              <input
                type="text"
                required
                value={targetUidInput}
                onChange={e => setTargetUidInput(e.target.value)}
                placeholder="e.g. jx98K2... (Auth UID)"
                className="w-full rounded border border-[#303030] bg-[#141414] px-3 py-2 text-xs text-white placeholder-neutral-600 outline-none focus:border-[#FF1E1E]"
              />
            </div>
            <button
              type="submit"
              disabled={actionSubmitting || !targetUidInput.trim()}
              className="w-full rounded bg-[#FF1E1E] py-2.5 text-xs font-semibold text-white hover:bg-red-600 transition-colors disabled:opacity-50"
            >
              {actionSubmitting ? 'Granting Access…' : 'Grant Administrator Privileges'}
            </button>
          </form>

          <div className="rounded border border-[#222] bg-[#111] p-3 text-[11px] text-neutral-400 space-y-2">
            <p className="font-semibold text-white">Security Guards Active:</p>
            <ul className="list-disc pl-4 space-y-1 text-neutral-400">
              <li>Admins cannot remove their own admin record.</li>
              <li>Last administrator removal is blocked automatically.</li>
              <li>All grants and revocations record an immutable audit log entry.</li>
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
};
