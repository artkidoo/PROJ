import React, { useState, useEffect } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../../lib/firebase';

interface AdminDoc { uid: string; role?: string; grantedAt?: string; }

export const AdminAccounts: React.FC = () => {
  const [admins, setAdmins] = useState<AdminDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Firestore rules only allow reading own admin doc; listing may be denied.
    const unsub = onSnapshot(collection(db, 'admins'), (snap) => {
      setAdmins(snap.docs.map(d => ({ uid: d.id, ...(d.data() as any) })));
      setLoading(false);
    }, (err) => {
      setError(err?.message || 'Unable to load admin accounts (read access restricted by security rules).');
      setLoading(false);
    });
    return () => unsub();
  }, []);

  if (loading) return <div className="text-neutral-500 text-sm py-12 text-center">Loading…</div>;

  return (
    <div>
      <p className="text-neutral-500 text-xs mb-4">
        Admin grants are managed server-side via the <code>admins</code> collection. Client-side creation, suspension or removal is intentionally disabled for security.
      </p>
      {error && <div className="text-yellow-400 text-sm mb-4">{error}</div>}
      {admins.length === 0 && !error && <p className="text-neutral-500 text-sm">No admin accounts visible (listing may be restricted by security rules).</p>}
      <div className="overflow-x-auto border border-[#1A1A1A] rounded">
        <table className="w-full text-sm">
          <thead className="bg-[#0C0C0C] text-neutral-500 text-xs uppercase tracking-widest">
            <tr><th className="text-left px-4 py-3">UID</th><th className="text-left px-4 py-3">Role</th><th className="text-left px-4 py-3">Granted</th></tr>
          </thead>
          <tbody>
            {admins.map(a => (
              <tr key={a.uid} className="border-t border-[#1A1A1A]">
                <td className="px-4 py-3 text-white">{a.uid}</td>
                <td className="px-4 py-3 text-neutral-400">{a.role || '—'}</td>
                <td className="px-4 py-3 text-neutral-500 text-xs">{a.grantedAt ? new Date(a.grantedAt).toLocaleString() : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminAccounts;
