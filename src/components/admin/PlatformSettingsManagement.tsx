/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * KEEDOHUB — Platform Settings Management
 */

import React, { useState, useEffect } from 'react';
import { doc, getDoc, setDoc, collection, addDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useApp } from '../../context/AppContext';
import { Settings, Save, CheckCircle2, ShieldAlert, Globe, Mail, Building, Sliders } from 'lucide-react';

interface PlatformSettings {
  platformName: string;
  supportEmail: string;
  contactPhone: string;
  publicWebsite: string;
  agencyAddress: string;
  defaultCurrency: string;
  standardTurnaroundDays: number;
  clientRegistrationEnabled: boolean;
  emailAlertsEnabled: boolean;
  slackWebhookUrl?: string;
  updatedAt?: string;
}

const DEFAULT_SETTINGS: PlatformSettings = {
  platformName: 'KeedoHub Creative Agency & Platform',
  supportEmail: 'support@keedohub.com',
  contactPhone: '+1 (800) 555-KEEDO',
  publicWebsite: 'https://keedohub.com',
  agencyAddress: '710 Broadway, Suite 4B, New York, NY 10003',
  defaultCurrency: 'USD',
  standardTurnaroundDays: 7,
  clientRegistrationEnabled: true,
  emailAlertsEnabled: true,
  slackWebhookUrl: '',
};

export const PlatformSettingsManagement: React.FC = () => {
  const { firebaseUser, clientProfile } = useApp();
  const [settings, setSettings] = useState<PlatformSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    let active = true;
    void getDoc(doc(db, 'settings', 'platform')).then(snapshot => {
      if (!active) return;
      if (snapshot.exists()) {
        setSettings({ ...DEFAULT_SETTINGS, ...(snapshot.data() as PlatformSettings) });
      }
      setLoading(false);
    }).catch(err => {
      if (!active) return;
      setError(err?.message || 'Failed to load platform settings.');
      setLoading(false);
    });
    return () => { active = false; };
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firebaseUser) return;
    setSaving(true);
    setError('');
    setSuccessMessage('');
    const now = new Date().toISOString();
    const updated: PlatformSettings = { ...settings, updatedAt: now };

    try {
      await setDoc(doc(db, 'settings', 'platform'), updated, { merge: true });
      // Record immutable audit log
      await addDoc(collection(db, 'adminAuditLogs'), {
        actorUid: firebaseUser.uid,
        actorName: clientProfile?.displayName || firebaseUser.email || firebaseUser.uid,
        action: 'update_platform_settings',
        target: 'settings/platform',
        details: JSON.stringify({ platformName: updated.platformName, supportEmail: updated.supportEmail }),
        createdAt: now,
      });
      setSuccessMessage('Platform settings successfully updated and audit logged.');
    } catch (err: any) {
      setError(err?.message || 'Failed to save platform settings.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="py-12 text-center text-sm text-neutral-500">Loading platform settings…</div>;
  }

  return (
    <div className="space-y-6">
      <div className="border-b border-[#1E1E1E] pb-5">
        <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-[#FF1E1E]">Platform Configuration</p>
        <h2 className="mt-1 text-2xl font-bold text-white">Platform Settings & Governance</h2>
        <p className="mt-1 text-sm text-neutral-400">Configure core agency identity, official communications, operational defaults, and notification preferences.</p>
      </div>

      {error && <div role="alert" className="rounded border border-red-500/30 bg-red-950/30 p-3 text-sm text-red-300">{error}</div>}
      {successMessage && <div role="status" className="rounded border border-emerald-500/30 bg-emerald-950/20 p-3 text-sm text-emerald-300">{successMessage}</div>}

      <form onSubmit={handleSave} className="grid gap-6 xl:grid-cols-2">
        {/* Agency Identity & Contact */}
        <section className="rounded-xl border border-[#222] bg-[#0D0D0D] p-5 sm:p-6 space-y-4">
          <div className="flex items-center gap-2 text-white">
            <Building size={18} className="text-[#FF1E1E]" />
            <h3 className="text-base font-bold">Agency & Brand Identity</h3>
          </div>
          <p className="text-xs text-neutral-400 leading-relaxed">
            Identity details displayed across official documents, client invoices, and portal headers.
          </p>

          <div className="space-y-3">
            <div>
              <label className="block text-[10px] font-semibold uppercase tracking-wider text-neutral-500 mb-1">Platform / Agency Name</label>
              <input
                type="text"
                required
                value={settings.platformName}
                onChange={e => setSettings({ ...settings, platformName: e.target.value })}
                className="w-full rounded border border-[#303030] bg-[#141414] px-3 py-2.5 text-xs text-white outline-none focus:border-[#FF1E1E]"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-semibold uppercase tracking-wider text-neutral-500 mb-1">Support Email</label>
                <input
                  type="email"
                  required
                  value={settings.supportEmail}
                  onChange={e => setSettings({ ...settings, supportEmail: e.target.value })}
                  className="w-full rounded border border-[#303030] bg-[#141414] px-3 py-2.5 text-xs text-white outline-none focus:border-[#FF1E1E]"
                />
              </div>
              <div>
                <label className="block text-[10px] font-semibold uppercase tracking-wider text-neutral-500 mb-1">Contact Phone</label>
                <input
                  type="text"
                  value={settings.contactPhone}
                  onChange={e => setSettings({ ...settings, contactPhone: e.target.value })}
                  className="w-full rounded border border-[#303030] bg-[#141414] px-3 py-2.5 text-xs text-white outline-none focus:border-[#FF1E1E]"
                />
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-semibold uppercase tracking-wider text-neutral-500 mb-1">Public Website URL</label>
              <input
                type="url"
                value={settings.publicWebsite}
                onChange={e => setSettings({ ...settings, publicWebsite: e.target.value })}
                className="w-full rounded border border-[#303030] bg-[#141414] px-3 py-2.5 text-xs text-white outline-none focus:border-[#FF1E1E]"
              />
            </div>
            <div>
              <label className="block text-[10px] font-semibold uppercase tracking-wider text-neutral-500 mb-1">Corporate Address</label>
              <textarea
                rows={2}
                value={settings.agencyAddress}
                onChange={e => setSettings({ ...settings, agencyAddress: e.target.value })}
                className="w-full rounded border border-[#303030] bg-[#141414] px-3 py-2 text-xs text-white outline-none focus:border-[#FF1E1E]"
              />
            </div>
          </div>
        </section>

        {/* Operational & Notification Preferences */}
        <section className="rounded-xl border border-[#222] bg-[#0D0D0D] p-5 sm:p-6 space-y-4">
          <div className="flex items-center gap-2 text-white">
            <Sliders size={18} className="text-blue-400" />
            <h3 className="text-base font-bold">Operational Preferences</h3>
          </div>
          <p className="text-xs text-neutral-400 leading-relaxed">
            Control billing defaults, production timelines, and client onboarding policies.
          </p>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-semibold uppercase tracking-wider text-neutral-500 mb-1">Default Currency</label>
                <select
                  value={settings.defaultCurrency}
                  onChange={e => setSettings({ ...settings, defaultCurrency: e.target.value })}
                  className="w-full rounded border border-[#303030] bg-[#141414] px-3 py-2.5 text-xs text-white outline-none focus:border-[#FF1E1E]"
                >
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="GBP">GBP (£)</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-semibold uppercase tracking-wider text-neutral-500 mb-1">Standard Turnaround (Days)</label>
                <input
                  type="number"
                  min="1"
                  max="365"
                  value={settings.standardTurnaroundDays}
                  onChange={e => setSettings({ ...settings, standardTurnaroundDays: Number(e.target.value) || 7 })}
                  className="w-full rounded border border-[#303030] bg-[#141414] px-3 py-2.5 text-xs text-white outline-none focus:border-[#FF1E1E]"
                />
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.clientRegistrationEnabled}
                  onChange={e => setSettings({ ...settings, clientRegistrationEnabled: e.target.checked })}
                  className="rounded border-[#303030] bg-[#141414] text-[#FF1E1E] focus:ring-0"
                />
                <span className="text-xs text-neutral-300">Enable new client self-registration</span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.emailAlertsEnabled}
                  onChange={e => setSettings({ ...settings, emailAlertsEnabled: e.target.checked })}
                  className="rounded border-[#303030] bg-[#141414] text-[#FF1E1E] focus:ring-0"
                />
                <span className="text-xs text-neutral-300">Enable email & production dispatch alerts</span>
              </label>
            </div>

            <div>
              <label className="block text-[10px] font-semibold uppercase tracking-wider text-neutral-500 mb-1">Webhook / Slack Integration URL (Optional)</label>
              <input
                type="url"
                value={settings.slackWebhookUrl || ''}
                onChange={e => setSettings({ ...settings, slackWebhookUrl: e.target.value })}
                placeholder="https://hooks.slack.com/services/..."
                className="w-full rounded border border-[#303030] bg-[#141414] px-3 py-2.5 text-xs text-white placeholder-neutral-600 outline-none focus:border-[#FF1E1E]"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-[#1C1C1C] flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 rounded bg-[#FF1E1E] px-5 py-2.5 text-xs font-semibold text-white hover:bg-red-600 transition-colors disabled:opacity-50"
            >
              <Save size={14} />
              <span>{saving ? 'Saving Settings…' : 'Save Platform Settings'}</span>
            </button>
          </div>
        </section>
      </form>
    </div>
  );
};
