import React, { useState, useEffect, useMemo } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { doc, getDoc } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { db, functions } from '../../lib/firebase';
import { ClientProfile } from '../../types';
import { Edit3, Power, ShieldCheck } from 'lucide-react';

interface Props {
  onSelectClient: (uid: string) => void;
}

export const ClientsDirectory: React.FC<Props> = ({ onSelectClient }) => {
  const [clients, setClients] = useState<ClientProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [statusFilter, setStatusFilter] = useState<string>('All');

  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, 'clientProfiles'),
      (snap) => {
        const list = snap.docs.map((d) => ({ ...(d.data() as any), uid: d.data().uid || d.id })) as ClientProfile[];
        setClients(list);
        setLoading(false);
      },
      (err) => {
        setError(err?.message || 'Failed to load clients.');
        setLoading(false);
      }
    );
    return () => unsub();
  });
  const [editingClient, setEditingClient] = useState<ClientProfile | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [editForm, setEditForm] = useState({ displayName: '', organizationName: '', accountType: 'Artist', status: 'Active' });
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving'>('idle');

  const openEdit = (client: ClientProfile) => {
    setEditingClient(client);
    setEditForm({ displayName: client.displayName, organizationName: client.organizationName, accountType: client.accountType, status: client.status || 'Active' });
    setEditOpen(true);
  };

  const saveClient = async () => {
    if (!editingClient) return;
    setSaveStatus('saving');
    const fn = httpsCallable(functions, 'adminUpdateClientProfile');
    try {
      await fn({
        uid: editingClient.uid,
        displayName: editForm.displayName.trim(),
        organizationName: editForm.organizationName.trim(),
        accountType: editForm.accountType,
        status: editForm.status,
      });
      setEditOpen(false);
      setSaveStatus('idle');
    } catch (err: any) {
      console.error('Client update failed:', err);
      setSaveStatus('idle');
    }
  };

  const toggleClientStatus = async (uid: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'Active' ? 'Suspended' : 'Active';
    const fn = httpsCallable(functions, 'adminUpdateClientProfile');
    try {
      await fn({ uid, status: nextStatus });
    } catch (err: any) {
      console.error('Client status update failed:', err);
    }
  };

  const filtered = useMemo(() => {
    return clients.filter((c) => {
      const q = search.toLowerCase();
      const matchesSearch = !q || c.displayName.toLowerCase().includes(q) || c.email.toLowerCase().includes(q) || c.organizationName.toLowerCase().includes(q);
      const matchesCat = categoryFilter === 'All' || c.accountType === categoryFilter;
      const matchesStatus = statusFilter === 'All' || (statusFilter === 'Active' ? c.onboardingComplete : !c.onboardingComplete);
      return matchesSearch && matchesCat && matchesStatus;
    });
  }, [clients, search, categoryFilter, statusFilter]);

  if (loading) return <div className="text-neutral-500 text-sm py-12 text-center">Loading clients…</div>;
  if (error) return <div className="text-red-400 text-sm py-12 text-center">{error}</div>;
  if (clients.length === 0) return <div className="text-neutral-500 text-sm py-12 text-center">No clients registered yet.</div>;

  return (
    <div>
      <div className="flex flex-col md:flex-row gap-3 mb-6">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, email or organisation…"
          className="flex-1 bg-[#0C0C0C] border border-[#222] text-white px-4 py-2 rounded text-sm focus:border-[#FF1E1E] focus:outline-none"
        />
        <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="bg-[#0C0C0C] border border-[#222] text-white px-3 py-2 rounded text-sm">
          <option value="All">All Categories</option>
          <option value="Artist">Artist</option>
          <option value="Brand">Brand</option>
          <option value="Company">Company</option>
        </select>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="bg-[#0C0C0C] border border-[#222] text-white px-3 py-2 rounded text-sm">
          <option value="All">All Statuses</option>
          <option value="Active">Onboarding Complete</option>
          <option value="Pending">Onboarding Incomplete</option>
        </select>
      </div>

      <div className="overflow-x-auto border border-[#1A1A1A] rounded">
        <table className="w-full text-sm">
          <thead className="bg-[#0C0C0C] text-neutral-500 text-xs uppercase tracking-widest">
            <tr>
              <th className="text-left px-4 py-3">Name</th>
              <th className="text-left px-4 py-3">Email</th>
              <th className="text-left px-4 py-3">Category</th>
              <th className="text-left px-4 py-3">Organisation</th>
              <th className="text-left px-4 py-3">Status</th>
              <th className="text-left px-4 py-3">Registered</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((c) => (
              <tr key={c.uid} onClick={() => onSelectClient(c.uid)} className="border-t border-[#1A1A1A] hover:bg-[#111] cursor-pointer">
                <td className="px-4 py-3 text-white font-medium">{c.displayName}</td>
                <td className="px-4 py-3 text-neutral-400">{c.email}</td>
                <td className="px-4 py-3 text-neutral-300">{c.accountType}</td>
                <td className="px-4 py-3 text-neutral-400">{c.organizationName}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-1 rounded ${c.onboardingComplete ? 'bg-green-500/10 text-green-400' : 'bg-yellow-500/10 text-yellow-400'}`}>
                    {c.onboardingComplete ? 'Onboarding Complete' : 'Onboarding Incomplete'}
                  </span>
                  {c.status && (
                    <span className={`ml-2 text-[10px] font-mono px-1.5 py-0.5 rounded ${c.status === 'Active' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-gray-500/10 text-gray-400'}`}>
                      {c.status}
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-neutral-500 text-xs">
                  <span className="inline-flex items-center gap-1">
                    <span className="text-[10px] text-neutral-400">{new Date(c.createdAt).toLocaleDateString()}</span>
                    {editingClient?.uid !== c.uid && (
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); openEdit(c); }}
                        className="ml-2 text-[10px] text-neutral-400 hover:text-white"
                        title="Edit profile"
                      >
                        <Edit3 size={12} />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); toggleClientStatus(c.uid, c.status || 'Active'); }}
                      className="ml-1 text-[10px] text-neutral-400 hover:text-white"
                      title={c.status === 'Active' ? 'Suspend' : 'Reactivate'}
                    >
                      <Power size={12} />
                    </button>
                  </span>
                </td>
              </tr>
            ))}
  {editOpen && (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
      <div className="w-full max-w-lg space-y-4 rounded-xl border border-[#292929] bg-[#0C0C0C] p-5 shadow-2xl">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-white">Edit client profile</h2>
          <button type="button" onClick={() => setEditOpen(false)} className="text-sm text-neutral-400 hover:text-white">Close</button>
        </div>
        <div className="space-y-3">
          <div>
            <label className="text-[10px] font-mono uppercase text-neutral-500">Display name</label>
            <input value={editForm.displayName} onChange={e => setEditForm(f => ({ ...f, displayName: e.target.value }))} className="w-full rounded border border-[#333] bg-[#141414] px-3 py-2 text-sm text-white" />
          </div>
          <div>
            <label className="text-[10px] font-mono uppercase text-neutral-500">Organization name</label>
            <input value={editForm.organizationName} onChange={e => setEditForm(f => ({ ...f, organizationName: e.target.value }))} className="w-full rounded border border-[#333] bg-[#141414] px-3 py-2 text-sm text-white" />
          </div>
          <div>
            <label className="text-[10px] font-mono uppercase text-neutral-500">Account type</label>
            <select value={editForm.accountType} onChange={e => setEditForm(f => ({ ...f, accountType: e.target.value }))} className="w-full rounded border border-[#333] bg-[#141414] px-3 py-2 text-sm text-white">
              <option>Artist</option><option>Brand</option><option>Company</option>
            </select>
          </div>
          <div>
            <label className="text-[10px] font-mono uppercase text-neutral-500">Account status</label>
            <select value={editForm.status} onChange={e => setEditForm(f => ({ ...f, status: e.target.value }))} className="w-full rounded border border-[#333] bg-[#141414] px-3 py-2 text-sm text-white">
              <option value="Active">Active</option>
              <option value="Suspended">Suspended</option>
            </select>
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <button type="button" onClick={() => setEditOpen(false)} className="rounded border border-[#333] px-4 py-2 text-sm text-white">Cancel</button>
          <button type="button" onClick={saveClient} disabled={saveStatus === 'saving'} className="rounded bg-[#FF1E1E] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{saveStatus === 'saving' ? 'Saving...' : 'Save'}</button>
        </div>
      </div>
    </div>
  )}
            {filtered.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-neutral-500">No clients match your filters.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ClientsDirectory;
