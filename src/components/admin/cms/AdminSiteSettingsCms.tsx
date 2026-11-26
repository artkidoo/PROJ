/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * KEEDOHUB — Website CMS Site Settings Management Console
 */
import React, { useState } from 'react';
import { Loader2, Save, X } from 'lucide-react';
import { useApp } from '../../../context/AppContext';
import { useWebsiteCms } from '../../../context/WebsiteCmsContext';
import { saveSiteSettingsCms, DEFAULT_SITE_SETTINGS } from '../../../lib/websiteCms';
import type { SiteSettingsCmsConfig } from '../../../types/cms';
import { AdminMediaLibrary } from './AdminMediaLibrary';

export const AdminSiteSettingsCms: React.FC = () => {
  const { firebaseUser } = useApp();
  const { siteSettings } = useWebsiteCms();

  const [form, setForm] = useState<SiteSettingsCmsConfig>(siteSettings || DEFAULT_SITE_SETTINGS);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [mediaModalField, setMediaModalField] = useState<keyof SiteSettingsCmsConfig | null>(null);

  const handleChange = (field: keyof SiteSettingsCmsConfig, value: unknown) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      await saveSiteSettingsCms(form, firebaseUser?.uid || 'admin');
      setSaving(false);
      setSuccessMsg('Site settings updated and published successfully.');
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to save site settings.');
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

      <div className="border border-[#1E1E1E] bg-[#0E0E0E] p-6 space-y-6">
        <h3 className="text-sm font-bold uppercase tracking-wider text-white border-b border-[#1E1E1E] pb-3">
          Global Identity &amp; Metadata Settings
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-mono uppercase text-neutral-400">Site / Brand Name</label>
            <input
              type="text"
              required
              value={form.siteName || ''}
              onChange={e => handleChange('siteName', e.target.value)}
              className="w-full bg-[#141414] border border-[#262626] focus:border-[#FF1E1E] px-3.5 py-2 text-xs text-white focus:outline-none font-bold"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-mono uppercase text-neutral-400">Tagline</label>
            <input
              type="text"
              value={form.tagline || ''}
              onChange={e => handleChange('tagline', e.target.value)}
              className="w-full bg-[#141414] border border-[#262626] focus:border-[#FF1E1E] px-3.5 py-2 text-xs text-white focus:outline-none"
            />
          </div>

          <div className="space-y-1.5 sm:col-span-2">
            <label className="block text-xs font-mono uppercase text-neutral-400">Brand Mark (Dark Surface URL)</label>
            <div className="flex gap-2">
              <input
                type="url"
                value={form.markDarkSurfaceUrl || ''}
                onChange={e => handleChange('markDarkSurfaceUrl', e.target.value)}
                className="flex-1 bg-[#141414] border border-[#262626] focus:border-[#FF1E1E] px-3.5 py-2 text-xs text-white focus:outline-none font-mono"
              />
              <button
                type="button"
                onClick={() => setMediaModalField('markDarkSurfaceUrl')}
                className="border border-[#333] hover:border-white bg-[#181818] px-3 py-2 text-xs text-white"
              >
                Media Library
              </button>
            </div>
          </div>

          <div className="space-y-1.5 sm:col-span-2">
            <label className="block text-xs font-mono uppercase text-neutral-400">Favicon URL</label>
            <div className="flex gap-2">
              <input
                type="url"
                value={form.faviconUrl || ''}
                onChange={e => handleChange('faviconUrl', e.target.value)}
                className="flex-1 bg-[#141414] border border-[#262626] focus:border-[#FF1E1E] px-3.5 py-2 text-xs text-white focus:outline-none font-mono"
              />
              <button
                type="button"
                onClick={() => setMediaModalField('faviconUrl')}
                className="border border-[#333] hover:border-white bg-[#181818] px-3 py-2 text-xs text-white"
              >
                Media Library
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-mono uppercase text-neutral-400">Default SEO Title</label>
            <input
              type="text"
              value={form.defaultSeoTitle || ''}
              onChange={e => handleChange('defaultSeoTitle', e.target.value)}
              className="w-full bg-[#141414] border border-[#262626] focus:border-[#FF1E1E] px-3.5 py-2 text-xs text-white focus:outline-none"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-mono uppercase text-neutral-400">Default SEO Description</label>
            <input
              type="text"
              value={form.defaultSeoDescription || ''}
              onChange={e => handleChange('defaultSeoDescription', e.target.value)}
              className="w-full bg-[#141414] border border-[#262626] focus:border-[#FF1E1E] px-3.5 py-2 text-xs text-white focus:outline-none"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-mono uppercase text-neutral-400">Contact Email</label>
            <input
              type="email"
              value={form.contactEmail || ''}
              onChange={e => handleChange('contactEmail', e.target.value)}
              className="w-full bg-[#141414] border border-[#262626] focus:border-[#FF1E1E] px-3.5 py-2 text-xs text-white focus:outline-none"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-mono uppercase text-neutral-400">Studio Locations Text</label>
            <input
              type="text"
              value={form.studioLocations || ''}
              onChange={e => handleChange('studioLocations', e.target.value)}
              className="w-full bg-[#141414] border border-[#262626] focus:border-[#FF1E1E] px-3.5 py-2 text-xs text-white focus:outline-none"
            />
          </div>

          <div className="space-y-1.5 sm:col-span-2">
            <label className="block text-xs font-mono uppercase text-neutral-400">Footer Bio Summary</label>
            <textarea
              rows={2}
              value={form.footerBio || ''}
              onChange={e => handleChange('footerBio', e.target.value)}
              className="w-full bg-[#141414] border border-[#262626] focus:border-[#FF1E1E] p-3 text-xs text-white focus:outline-none"
            />
          </div>

          <div className="space-y-1.5 sm:col-span-2">
            <label className="block text-xs font-mono uppercase text-neutral-400">Copyright Notice</label>
            <input
              type="text"
              value={form.copyrightText || ''}
              onChange={e => handleChange('copyrightText', e.target.value)}
              className="w-full bg-[#141414] border border-[#262626] focus:border-[#FF1E1E] px-3.5 py-2 text-xs text-white focus:outline-none"
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#1E1E1E]">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 bg-[#FF1E1E] hover:bg-white hover:text-black text-white px-8 py-3 text-xs font-bold uppercase tracking-wider transition-colors disabled:opacity-50"
          >
            {saving && <Loader2 size={14} className="animate-spin" />}
            <Save size={14} />
            <span>{saving ? 'Saving Settings…' : 'Save & Publish Settings'}</span>
          </button>
        </div>
      </div>

      {mediaModalField && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm overflow-y-auto"
          onClick={() => setMediaModalField(null)}
        >
          <div
            className="my-8 w-full max-w-4xl border border-[#2A2A2A] bg-[#0C0C0C] p-6 space-y-5"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[#1E1E1E] pb-3">
              <h3 className="text-sm font-bold uppercase tracking-wider text-white">Select Asset</h3>
              <button
                type="button"
                onClick={() => setMediaModalField(null)}
                className="text-neutral-400 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <AdminMediaLibrary
              selectionMode={true}
              onSelectAsset={url => {
                handleChange(mediaModalField, url);
                setMediaModalField(null);
              }}
            />
          </div>
        </div>
      )}
    </form>
  );
};
