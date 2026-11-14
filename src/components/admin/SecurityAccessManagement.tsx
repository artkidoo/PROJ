/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * KEEDOHUB — Security & Access Monitoring
 */

import React, { useState, useEffect } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Lock, ShieldCheck, ShieldAlert, KeyRound, CheckCircle2, AlertTriangle, UserX } from 'lucide-react';

interface AdminRecord {
  uid: string;
  role?: string;
  status?: string;
  grantedAt?: string;
}

export const SecurityAccessManagement: React.FC = () => {
  const [admins, setAdmins] = useState<AdminRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'admins'), snapshot => {
      setAdmins(snapshot.docs.map(doc => ({ uid: doc.id, ...(doc.data() as any) })));
      setLoading(false);
    }, () => setLoading(false));
    return () => unsub();
  }, []);

  const activeAdminsCount = admins.filter(a => !a.status || a.status === 'Active').length;
  const suspendedAdminsCount = admins.filter(a => a.status === 'Suspended' || a.status === 'Revoked').length;

  return (
    <div className="space-y-6">
      <div className="border-b border-[#1E1E1E] pb-5">
        <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-[#FF1E1E]">Platform Security</p>
        <h2 className="mt-1 text-2xl font-bold text-white">Security & Access Monitoring</h2>
        <p className="mt-1 text-sm text-neutral-400">Inspect active administrative access controls, Firestore security enforcement boundaries, and session authentication integrity.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-[#222] bg-[#0D0D0D] p-5">
          <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-emerald-400">Active Administrators</p>
          <p className="mt-2 text-2xl font-bold text-white">{activeAdminsCount}</p>
          <p className="mt-1 text-xs text-neutral-500">Authenticated via verified Firebase Auth UIDs</p>
        </div>
        <div className="rounded-xl border border-[#222] bg-[#0D0D0D] p-5">
          <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-amber-400">Suspended / Revoked Access</p>
          <p className="mt-2 text-2xl font-bold text-white">{suspendedAdminsCount}</p>
          <p className="mt-1 text-xs text-neutral-500">Instantly denied by backend rules & asserts</p>
        </div>
        <div className="rounded-xl border border-[#222] bg-[#0D0D0D] p-5">
          <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-blue-400">Firestore Security Rules</p>
          <p className="mt-2 text-2xl font-bold text-white">Active (v2)</p>
          <p className="mt-1 text-xs text-neutral-500">Default-deny with master gate relational checks</p>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <section className="rounded-xl border border-[#222] bg-[#0D0D0D] p-5 sm:p-6 space-y-4">
          <div className="flex items-center gap-2 text-white">
            <ShieldCheck size={18} className="text-emerald-400" />
            <h3 className="text-base font-bold">Role-Based Access Control Architecture</h3>
          </div>
          <p className="text-xs text-neutral-400 leading-relaxed">
            KeedoHub enforces strict role validation across client workspaces and administrative modules. All sensitive operations require server-side callable functions executing `assertActiveAdmin()`.
          </p>
          <div className="space-y-2 text-xs">
            <div className="rounded border border-[#222] bg-[#111] p-3 flex justify-between items-center">
              <div>
                <strong className="text-white">Platform Owner / Super Admin</strong>
                <p className="text-neutral-500 text-[11px]">Full platform governance, admin grants, financial oversight.</p>
              </div>
              <span className="text-[10px] font-semibold uppercase text-emerald-400">Protected</span>
            </div>
            <div className="rounded border border-[#222] bg-[#111] p-3 flex justify-between items-center">
              <div>
                <strong className="text-white">Platform Administrator</strong>
                <p className="text-neutral-500 text-[11px]">Client accounts, workspace management, catalog governance.</p>
              </div>
              <span className="text-[10px] font-semibold uppercase text-emerald-400">Protected</span>
            </div>
            <div className="rounded border border-[#222] bg-[#111] p-3 flex justify-between items-center">
              <div>
                <strong className="text-white">Production Administrator</strong>
                <p className="text-neutral-500 text-[11px]">Creative production studio, task progression, deliverable QA.</p>
              </div>
              <span className="text-[10px] font-semibold uppercase text-emerald-400">Protected</span>
            </div>
          </div>
        </section>

        <section className="rounded-xl border border-[#222] bg-[#0D0D0D] p-5 sm:p-6 space-y-4">
          <div className="flex items-center gap-2 text-white">
            <Lock size={18} className="text-[#FF1E1E]" />
            <h3 className="text-base font-bold">Security Safeguards & Invariants</h3>
          </div>
          <ul className="space-y-3 text-xs text-neutral-300">
            <li className="flex items-start gap-2">
              <CheckCircle2 size={15} className="text-emerald-400 shrink-0 mt-0.5" />
              <span><strong>Last Admin Protection:</strong> Transactions automatically verify that at least one active platform administrator remains before completing any revocation.</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 size={15} className="text-emerald-400 shrink-0 mt-0.5" />
              <span><strong>Self-Elevation Prevention:</strong> Administrators cannot alter or elevate their own privileges or remove themselves.</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 size={15} className="text-emerald-400 shrink-0 mt-0.5" />
              <span><strong>Immutable Audit Trails:</strong> Every role assignment, client suspension, workspace update, and pricing change records an immutable audit log entry.</span>
            </li>
          </ul>
        </section>
      </div>
    </div>
  );
};
