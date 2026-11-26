/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * KEEDOHUB — Website CMS Navigation & Safeguards Management Console
 */
import React, { useState } from 'react';
import { ArrowDown, ArrowUp, Check, Loader2, RefreshCw, Save, Trash2, X } from 'lucide-react';
import { useApp } from '../../../context/AppContext';
import { useWebsiteCms } from '../../../context/WebsiteCmsContext';
import { saveSiteNavigationCms, DEFAULT_SITE_NAVIGATION } from '../../../lib/websiteCms';
import type { SiteNavigationConfig, SiteNavItem } from '../../../types/cms';

export const AdminNavigationCms: React.FC = () => {
  const { firebaseUser } = useApp();
  const { siteNavigation } = useWebsiteCms();

  const [form, setForm] = useState<SiteNavigationConfig>(siteNavigation || DEFAULT_SITE_NAVIGATION);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleToggleHeaderItem = (id: string) => {
    setForm(prev => ({
      ...prev,
      headerItems: prev.headerItems.map(item =>
        item.id === id ? { ...item, visible: !item.visible } : item,
      ),
    }));
  };

  const handleToggleMobileItem = (id: string) => {
    setForm(prev => ({
      ...prev,
      mobileItems: prev.mobileItems.map(item =>
        item.id === id ? { ...item, visible: !item.visible } : item,
      ),
    }));
  };

  const handleRestoreDefaults = () => {
    setForm({ ...DEFAULT_SITE_NAVIGATION });
    setSuccessMsg('Restored default navigation items (with critical safeguards).');
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const saved = await saveSiteNavigationCms(form, firebaseUser?.uid || 'admin');
      setForm(saved);
      setSaving(false);
      setSuccessMsg('Site navigation and safeguards updated successfully.');
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to save navigation.');
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSave} className="space-y-8">
      {successMsg && (
        <div className="border border-emerald-900/60 bg-emerald-950/25 p-3.5 text-xs text-emerald-300">
          {successMsg}
        </div>
      )}
      {errorMsg && (
        <div className="border border-red-900/60 bg-red-950/25 p-3.5 text-xs text-red-300">
          {errorMsg}
        </div>
      )}

      {/* Header Navigation Safeguards */}
      <div className="border border-[#1E1E1E] bg-[#0E0E0E] p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-[#1E1E1E] pb-3">
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-white">Header Primary Navigation Items</h3>
            <p className="text-xs text-neutral-400 mt-0.5">Control desktop top bar links. Critical routes have safeguards against accidental removal.</p>
          </div>
          <button
            type="button"
            onClick={handleRestoreDefaults}
            className="inline-flex items-center gap-1.5 border border-[#333] hover:border-white bg-[#141414] px-3 py-1.5 text-xs font-semibold text-neutral-300 hover:text-white"
          >
            <RefreshCw size={12} />
            <span>Restore Defaults</span>
          </button>
        </div>

        <div className="space-y-2">
          {form.headerItems?.map(item => (
            <div
              key={item.id}
              className="flex items-center justify-between border border-[#222] bg-[#121212] px-4 py-3"
            >
              <div className="flex items-center gap-3">
                <span className="font-mono text-xs text-[#FF1E1E] font-bold">route: {item.route}</span>
                <span className="text-xs font-semibold text-white">{item.label}</span>
              </div>

              <label className="inline-flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={item.visible !== false}
                  onChange={() => handleToggleHeaderItem(item.id)}
                  className="rounded border-neutral-700 bg-neutral-900 text-[#FF1E1E] focus:ring-0"
                />
                <span className="font-mono text-[11px] text-neutral-300 uppercase">
                  {item.visible !== false ? 'Visible' : 'Hidden'}
                </span>
              </label>
            </div>
          ))}
        </div>
      </div>

      {/* Mobile Navigation Items */}
      <div className="border border-[#1E1E1E] bg-[#0E0E0E] p-6 space-y-4">
        <div className="border-b border-[#1E1E1E] pb-3">
          <h3 className="text-sm font-bold uppercase tracking-wider text-white">Mobile Drawer Navigation Items</h3>
          <p className="text-xs text-neutral-400 mt-0.5">Control links displayed in the mobile drawer dropdown menu.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {form.mobileItems?.map(item => (
            <div
              key={item.id}
              className="flex items-center justify-between border border-[#222] bg-[#121212] px-4 py-2.5"
            >
              <span className="text-xs text-white">{item.label}</span>
              <label className="inline-flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={item.visible !== false}
                  onChange={() => handleToggleMobileItem(item.id)}
                  className="rounded border-neutral-700 bg-neutral-900 text-[#FF1E1E] focus:ring-0"
                />
                <span className="font-mono text-[10px] text-neutral-300 uppercase">
                  {item.visible !== false ? 'Show' : 'Hide'}
                </span>
              </label>
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-end gap-3 pt-2">
        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center gap-2 bg-[#FF1E1E] hover:bg-white hover:text-black text-white px-8 py-3 text-xs font-bold uppercase tracking-wider transition-colors disabled:opacity-50"
        >
          {saving && <Loader2 size={14} className="animate-spin" />}
          <Save size={14} />
          <span>{saving ? 'Saving Navigation…' : 'Save & Publish Navigation'}</span>
        </button>
      </div>
    </form>
  );
};
