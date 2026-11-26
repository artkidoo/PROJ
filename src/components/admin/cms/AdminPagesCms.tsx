/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * KEEDOHUB — Website CMS Public Pages Management Console
 */
import React, { useEffect, useState } from 'react';
import { Check, Loader2, Save, Sparkles, X } from 'lucide-react';
import { useApp } from '../../../context/AppContext';
import { useWebsiteCms } from '../../../context/WebsiteCmsContext';
import { savePublicPageCms, DEFAULT_PUBLIC_PAGES } from '../../../lib/websiteCms';
import type { PublicPageCmsConfig, PublicPageId } from '../../../types/cms';
import { AdminMediaLibrary } from './AdminMediaLibrary';

const PAGE_OPTIONS: Array<{ id: PublicPageId; label: string }> = [
  { id: 'about', label: 'About the Agency' },
  { id: 'vision', label: 'Vision & Mission' },
  { id: 'services', label: 'Capabilities & Services' },
  { id: 'portfolio', label: 'Portfolio Showcase' },
  { id: 'artists', label: 'Artists & Visual Worlds' },
  { id: 'journal', label: 'Studio Journal' },
  { id: 'pricing', label: 'Packages & Scope' },
  { id: 'faq', label: 'FAQ' },
  { id: 'contact', label: 'Project Enquiry' },
];

export const AdminPagesCms: React.FC = () => {
  const { firebaseUser } = useApp();
  const { sitePages } = useWebsiteCms();

  const [activePageId, setActivePageId] = useState<PublicPageId>('about');
  const [form, setForm] = useState<PublicPageCmsConfig>(
    (sitePages && sitePages[activePageId]) || DEFAULT_PUBLIC_PAGES[activePageId],
  );
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [mediaModalOpen, setMediaModalOpen] = useState(false);

  useEffect(() => {
    if (sitePages && sitePages[activePageId]) {
      setForm({ ...sitePages[activePageId] });
    } else if (DEFAULT_PUBLIC_PAGES[activePageId]) {
      setForm({ ...DEFAULT_PUBLIC_PAGES[activePageId] });
    }
  }, [activePageId, sitePages]);

  const handleChange = (field: keyof PublicPageCmsConfig, value: unknown) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      await savePublicPageCms(form, firebaseUser?.uid || 'admin');
      setSaving(false);
      setSuccessMsg(`Page "${PAGE_OPTIONS.find(p => p.id === activePageId)?.label}" saved and published successfully.`);
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to save page CMS.');
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Selector Tabs */}
      <div
        role="tablist"
        aria-label="Public pages selection"
        className="border border-[#1E1E1E] bg-[#0B0B0B] p-2 flex flex-wrap items-center gap-1.5"
      >
        {PAGE_OPTIONS.map(opt => {
          const isActive = activePageId === opt.id;
          return (
            <button
              key={opt.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => setActivePageId(opt.id)}
              className={`px-3.5 py-2 text-xs font-semibold whitespace-nowrap transition-colors ${
                isActive
                  ? 'bg-[#FF1E1E] text-white font-bold'
                  : 'bg-[#121212] text-neutral-400 hover:text-white hover:bg-[#1a1a1a]'
              }`}
            >
              {opt.label}
            </button>
          );
        })}
      </div>

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

      {/* Editor Form */}
      <form onSubmit={handleSave} className="border border-[#1E1E1E] bg-[#0E0E0E] p-6 space-y-6">
        <div className="flex items-center justify-between border-b border-[#1E1E1E] pb-4">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-wider text-[#FF1E1E]">
              Page ID: {form.id}
            </p>
            <h3 className="text-base font-bold text-white">
              Editing: {PAGE_OPTIONS.find(p => p.id === activePageId)?.label}
            </h3>
          </div>

          <label className="inline-flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={Boolean(form.isVisible)}
              onChange={e => handleChange('isVisible', e.target.checked)}
              className="rounded border-neutral-700 bg-neutral-900 text-[#FF1E1E] focus:ring-0"
            />
            <span className="font-mono text-xs uppercase text-neutral-300">
              {form.isVisible ? 'Page Published & Visible' : 'Page Hidden'}
            </span>
          </label>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-mono uppercase text-neutral-400">Eyebrow / Kicker</label>
            <input
              type="text"
              value={form.eyebrow || ''}
              onChange={e => handleChange('eyebrow', e.target.value)}
              className="w-full bg-[#141414] border border-[#262626] focus:border-[#FF1E1E] px-3.5 py-2 text-xs text-white focus:outline-none"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-mono uppercase text-neutral-400">Subtitle / Tagline</label>
            <input
              type="text"
              value={form.subtitle || ''}
              onChange={e => handleChange('subtitle', e.target.value)}
              className="w-full bg-[#141414] border border-[#262626] focus:border-[#FF1E1E] px-3.5 py-2 text-xs text-white focus:outline-none"
            />
          </div>

          <div className="space-y-1.5 sm:col-span-2">
            <label className="block text-xs font-mono uppercase text-neutral-400">Page Main Title (H1)</label>
            <input
              type="text"
              value={form.title || ''}
              onChange={e => handleChange('title', e.target.value)}
              className="w-full bg-[#141414] border border-[#262626] focus:border-[#FF1E1E] px-3.5 py-2 text-xs text-white focus:outline-none font-bold text-sm"
            />
          </div>

          <div className="space-y-1.5 sm:col-span-2">
            <label className="block text-xs font-mono uppercase text-neutral-400">Intro Copy / Lead Paragraph</label>
            <textarea
              rows={3}
              value={form.introCopy || ''}
              onChange={e => handleChange('introCopy', e.target.value)}
              className="w-full bg-[#141414] border border-[#262626] focus:border-[#FF1E1E] p-3 text-xs text-white focus:outline-none leading-relaxed"
            />
          </div>

          <div className="space-y-1.5 sm:col-span-2">
            <label className="block text-xs font-mono uppercase text-neutral-400">Secondary Copy (Optional)</label>
            <textarea
              rows={3}
              value={form.secondaryCopy || ''}
              onChange={e => handleChange('secondaryCopy', e.target.value)}
              className="w-full bg-[#141414] border border-[#262626] focus:border-[#FF1E1E] p-3 text-xs text-white focus:outline-none leading-relaxed"
            />
          </div>

          <div className="space-y-1.5 sm:col-span-2">
            <label className="block text-xs font-mono uppercase text-neutral-400">Hero Image URL</label>
            <div className="flex gap-2">
              <input
                type="url"
                value={form.heroImageUrl || ''}
                onChange={e => handleChange('heroImageUrl', e.target.value)}
                className="flex-1 bg-[#141414] border border-[#262626] focus:border-[#FF1E1E] px-3.5 py-2 text-xs text-white focus:outline-none font-mono"
              />
              <button
                type="button"
                onClick={() => setMediaModalOpen(true)}
                className="border border-[#333] hover:border-white bg-[#181818] px-3 py-2 text-xs text-white"
              >
                Media Library
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-mono uppercase text-neutral-400">SEO Meta Title</label>
            <input
              type="text"
              value={form.seoTitle || ''}
              onChange={e => handleChange('seoTitle', e.target.value)}
              className="w-full bg-[#141414] border border-[#262626] focus:border-[#FF1E1E] px-3.5 py-2 text-xs text-white focus:outline-none"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-mono uppercase text-neutral-400">SEO Meta Description</label>
            <input
              type="text"
              value={form.seoDescription || ''}
              onChange={e => handleChange('seoDescription', e.target.value)}
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
            <span>{saving ? 'Saving Page…' : 'Save & Publish Page'}</span>
          </button>
        </div>
      </form>

      {/* Media Picker Modal */}
      {mediaModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm overflow-y-auto"
          onClick={() => setMediaModalOpen(false)}
        >
          <div
            className="my-8 w-full max-w-4xl border border-[#2A2A2A] bg-[#0C0C0C] p-6 space-y-5"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[#1E1E1E] pb-3">
              <h3 className="text-sm font-bold uppercase tracking-wider text-white">
                Select Page Hero Image
              </h3>
              <button
                type="button"
                onClick={() => setMediaModalOpen(false)}
                className="text-neutral-400 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <AdminMediaLibrary
              selectionMode={true}
              onSelectAsset={url => {
                handleChange('heroImageUrl', url);
                setMediaModalOpen(false);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};
